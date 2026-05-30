import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp = null;

const readServiceAccount = () => {
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON) {
    const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    const sanitized = raw.replace(/"([^"]*)"/g, (m, p1) => {
      return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
    });
    return JSON.parse(sanitized);
  }

  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  throw new Error(
    "Firebase admin credentials eksik. FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON veya FIREBASE_ADMIN_* env değişkenlerini tanımlayın."
  );
};

export const getAdminApp = () => {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert(readServiceAccount()),
    storageBucket:
      process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
};

export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminStorage = () => getStorage(getAdminApp()).bucket();
