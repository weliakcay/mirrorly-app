// Admin custom claims setup
//
// VITE_ADMIN_EMAILS env'indeki email'leri Firebase Auth'ta { admin: true }
// custom claim'i ile isaretler. Bu claim ID token'a gomulur ve client tarafindan
// degistirilemez; Firestore rules ve API endpoint'lerinde
// request.auth.token.admin === true seklinde kontrol edilir.
//
// Calistirma: npm run set-admin

import { config as loadDotenv } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

loadDotenv({ path: ".env.local" });

// server/firebaseAdmin.js ile ayni mantik: oncelik service account JSON,
// yoksa split FIREBASE_ADMIN_* env'leri.
let projectId, clientEmail, privateKey;

if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON);
    projectId = sa.project_id;
    clientEmail = sa.client_email;
    privateKey = sa.private_key;
  } catch (err) {
    console.error("[set-admin] FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON parse hatasi:", err?.message);
    process.exit(1);
  }
} else {
  projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

const adminEmailsRaw = process.env.VITE_ADMIN_EMAILS || "";

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "[set-admin] Firebase Admin credentials eksik. .env.local'da FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON veya FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY tanimli olmali."
  );
  process.exit(1);
}

const emails = adminEmailsRaw
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

if (emails.length === 0) {
  console.error(
    "[set-admin] VITE_ADMIN_EMAILS env'i bos. .env.local'a virgul ile ayrilmis email listesi ekle."
  );
  process.exit(1);
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

const auth = getAuth(app);

console.log(`[set-admin] ${emails.length} email islenecek: ${emails.join(", ")}\n`);

let processed = 0;
let alreadyAdmin = 0;
let notFound = 0;
let failed = 0;

for (const email of emails) {
  try {
    const user = await auth.getUserByEmail(email);
    const existingClaims = user.customClaims || {};

    if (existingClaims.admin === true) {
      console.log(`  zaten admin: ${email} (uid: ${user.uid})`);
      alreadyAdmin += 1;
      continue;
    }

    await auth.setCustomUserClaims(user.uid, { ...existingClaims, admin: true });
    console.log(`  admin isaretlendi: ${email} (uid: ${user.uid})`);
    processed += 1;
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      console.warn(
        `  bulunamadi: ${email} - bu hesap Mirrorly'ye henuz giris yapmamis olabilir. Giris yaptiktan sonra script'i tekrar calistir.`
      );
      notFound += 1;
      continue;
    }
    console.error(`  hata: ${email} - ${error?.message || error}`);
    failed += 1;
  }
}

console.log(
  `\n[set-admin] Sonuc: ${processed} yeni admin, ${alreadyAdmin} zaten admin, ${notFound} bulunamadi, ${failed} hata.`
);
console.log(
  "Not: yeni admin isaretlenen kullanici bir sonraki login'de claim aktif gorecek (token yenilenir)."
);

process.exit(failed > 0 ? 1 : 0);
