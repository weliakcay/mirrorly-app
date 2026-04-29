// Server-authoritative kredi yukleme endpoint'i
//
// Yetki: yalnizca admin custom claim'i olan kullanicilar (Bearer ID token)
// Faz 0: manuel kredi yukleme (admin paneli kullanir)
// Faz 2: LemonSqueezy webhook handler ayni dahili akisi cagiracak
//
// Body:
//   ownerUid       (string, required)         - kredinin yuklenecegi UID
//   ownerRole      ('customer' | 'merchant')   - hangi koleksiyon
//   creditsDelta   (number, required)          - pozitif: yukle, negatif: dus
//   label          (string, optional)          - audit log metni
//   type           (string, optional)          - 'topup' | 'welcome' | 'refund' | 'subscription_renew' | 'manual_grant'
//   idempotencyKey (string, optional)          - ayni anahtarla 2. cagri tek transaction yaratir
//   garmentId      (string, optional)          - audit'e bagli garment varsa
//
// Response: { success, newBalance, transactionId, alreadyProcessed }

import { getAuth } from "firebase-admin/auth";

const VALID_ROLES = new Set(["customer", "merchant"]);
const VALID_TYPES = new Set([
  "topup",
  "welcome",
  "refund",
  "subscription_renew",
  "manual_grant",
  "spend",
]);

async function readJsonBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function verifyAdminToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  const idToken = authHeader.slice(7).trim();
  const { getAdminApp } = await import("../../server/firebaseAdmin.js");
  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifyIdToken(idToken);

  if (decoded.admin !== true) {
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  return decoded;
}

async function performTopup(payload) {
  const { ownerUid, ownerRole, creditsDelta, label, type, idempotencyKey, garmentId } = payload;

  if (!ownerUid || typeof ownerUid !== "string") {
    throw Object.assign(new Error("ownerUid eksik"), { status: 400 });
  }
  if (!VALID_ROLES.has(ownerRole)) {
    throw Object.assign(new Error("ownerRole 'customer' veya 'merchant' olmali"), { status: 400 });
  }
  if (typeof creditsDelta !== "number" || creditsDelta === 0 || !Number.isFinite(creditsDelta)) {
    throw Object.assign(new Error("creditsDelta sifirdan farkli sayi olmali"), { status: 400 });
  }

  const txType = type && VALID_TYPES.has(type) ? type : "topup";
  const txLabel = (label && String(label).slice(0, 200)) || (creditsDelta > 0 ? "Manuel kredi yukleme" : "Manuel kredi dusumu");

  const { getAdminDb } = await import("../../server/firebaseAdmin.js");
  const db = getAdminDb();

  const profileCollection = ownerRole === "merchant" ? "merchant_profiles" : "customer_profiles";
  const profileRef = db.collection(profileCollection).doc(ownerUid);
  const transactionsRef = profileRef.collection("credit_transactions");

  // Idempotency: ayni anahtarla zaten islem yapilmissa onu dondur
  if (idempotencyKey) {
    const existing = await transactionsRef
      .where("idempotencyKey", "==", idempotencyKey)
      .limit(1)
      .get();

    if (!existing.empty) {
      const profileSnap = await profileRef.get();
      const balance =
        typeof profileSnap.data()?.credits === "number" ? profileSnap.data().credits : 0;
      return {
        success: true,
        newBalance: balance,
        transactionId: existing.docs[0].id,
        alreadyProcessed: true,
      };
    }
  }

  // Atomik transaction: profili oku, krediyi guncelle, audit log yaz
  const result = await db.runTransaction(async (tx) => {
    const profileSnap = await tx.get(profileRef);
    if (!profileSnap.exists) {
      throw Object.assign(new Error(`${ownerRole} profili bulunamadi: ${ownerUid}`), { status: 404 });
    }

    const currentCredits =
      typeof profileSnap.data()?.credits === "number" ? profileSnap.data().credits : 0;
    const newBalance = Math.max(0, currentCredits + creditsDelta);

    const transactionDoc = transactionsRef.doc();
    const transactionData = {
      id: transactionDoc.id,
      type: txType,
      credits: creditsDelta,
      label: txLabel,
      createdAt: Date.now(),
      balanceAfter: newBalance,
    };
    if (idempotencyKey) transactionData.idempotencyKey = idempotencyKey;
    if (garmentId) transactionData.garmentId = garmentId;

    tx.set(profileRef, { credits: newBalance, updatedAt: Date.now() }, { merge: true });
    tx.set(transactionDoc, transactionData);

    return { newBalance, transactionId: transactionDoc.id };
  });

  return {
    success: true,
    newBalance: result.newBalance,
    transactionId: result.transactionId,
    alreadyProcessed: false,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json({
        success: true,
        message: "Mirrorly credits/topup endpoint reachable. POST ile kullanin.",
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method not allowed" });
      return;
    }

    let actor;
    try {
      actor = await verifyAdminToken(req);
    } catch (error) {
      const status = error?.status || 401;
      res.status(status).json({
        success: false,
        message: status === 403 ? "Bu islem icin admin yetkisi gerekli." : "Yetki dogrulanamadi.",
      });
      return;
    }

    const payload = await readJsonBody(req);
    const result = await performTopup(payload);

    console.log(
      `[credits/topup] admin=${actor.email || actor.uid} target=${payload.ownerRole}:${payload.ownerUid} delta=${payload.creditsDelta} txn=${result.transactionId} alreadyProcessed=${result.alreadyProcessed}`
    );

    res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    console.error("[credits/topup] error:", status, error?.message || error);
    res.status(status).json({
      success: false,
      message: error?.message || "Kredi islemi sirasinda hata olustu.",
    });
  }
}
