import { getAdminDb } from "./firebaseAdmin.js";

// Firestore doc ID kisitlari: '/' yok, '..' yok, '__...__' rezerve.
const sanitizeIdemKey = (key) => `idem_${String(key).replace(/[\/\\.]/g, "_").slice(0, 1400)}`;

// Ortak idempotent kredi yukleme. idempotencyKey verilirse ayni anahtarla ikinci
// cagri (LemonSqueezy retry / cift teslim) TEK transaction yaratir; profile'in
// credit_transactions alt koleksiyonuna audit kaydi da yazar.
const addCreditsIdempotent = async (collection, uid, creditsToAdd, extraProfileFields, idempotencyKey, label) => {
  const db = getAdminDb();
  const ref = db.collection(collection).doc(uid);
  const txnRef = idempotencyKey
    ? ref.collection("credit_transactions").doc(sanitizeIdemKey(idempotencyKey))
    : ref.collection("credit_transactions").doc();

  const result = await db.runTransaction(async (transaction) => {
    if (idempotencyKey) {
      const existing = await transaction.get(txnRef);
      if (existing.exists) {
        return { alreadyProcessed: true };
      }
    }

    const doc = await transaction.get(ref);
    const currentCredits =
      doc.exists && typeof doc.data()?.credits === "number" ? doc.data().credits : 0;
    const newBalance = currentCredits + creditsToAdd;

    transaction.set(
      ref,
      { credits: newBalance, updatedAt: Date.now(), ...(extraProfileFields || {}) },
      { merge: true }
    );
    transaction.set(txnRef, {
      id: txnRef.id,
      type: "topup",
      credits: creditsToAdd,
      label: label || "Kredi yukleme",
      createdAt: Date.now(),
      balanceAfter: newBalance,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });

    return { alreadyProcessed: false, newBalance };
  });

  return result;
};

export const addCreditsToMerchant = async (merchantUid, creditsToAdd, subscriptionTier, idempotencyKey) => {
  const extra = subscriptionTier ? { subscriptionTier } : undefined;
  const label = subscriptionTier ? `Abonelik kredisi: ${subscriptionTier}` : "Merchant kredi yukleme";
  return addCreditsIdempotent("merchant_profiles", merchantUid, creditsToAdd, extra, idempotencyKey, label);
};

export const addCreditsToCustomer = async (customerUid, creditsToAdd, idempotencyKey) => {
  return addCreditsIdempotent("customer_profiles", customerUid, creditsToAdd, undefined, idempotencyKey, "Musteri kredi paketi");
};
