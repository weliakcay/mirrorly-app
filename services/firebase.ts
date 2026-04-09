import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
} from "firebase/firestore";
import { getStorage, getDownloadURL, ref, uploadString } from "firebase/storage";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  CustomerProfile,
  DEFAULT_PROFILE,
  Garment,
  MerchantProfile,
  MerchantPublicProfile,
  UserRole,
} from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app;
let db: any;
let storage: any;
let auth: any;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("Firebase başarıyla başlatıldı.");
  } else {
    console.warn("Firebase yapılandırması eksik.");
  }
} catch (error) {
  console.error("Firebase başlatma hatası:", error);
}

export { auth, db, storage };

const COLLECTION_PRIVATE_PROFILE = "merchant_profiles";
const COLLECTION_PUBLIC_PROFILE = "merchant_public";
const COLLECTION_GARMENTS = "garments";

const cleanData = <T extends Record<string, any>>(data: T): T => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

const toPublicMerchantProfile = (profile: MerchantProfile): MerchantPublicProfile => ({
  uid: profile.uid,
  name: profile.name,
  logoUrl: profile.logoUrl,
  description: profile.description,
  instagramUrl: profile.instagramUrl,
  defaultShopUrl: profile.defaultShopUrl,
  whatsappNumber: profile.whatsappNumber,
});

const mergeMerchantDocs = (
  uid: string,
  privateDoc?: Partial<MerchantProfile> | null,
  publicDoc?: Partial<MerchantPublicProfile> | null
): MerchantProfile | null => {
  if (!privateDoc && !publicDoc) return null;

  return cleanData({
    ...DEFAULT_PROFILE,
    ...publicDoc,
    ...privateDoc,
    uid,
    role: "merchant",
    credits: typeof privateDoc?.credits === "number" ? privateDoc.credits : DEFAULT_PROFILE.credits,
    modelPreset: privateDoc?.modelPreset || DEFAULT_PROFILE.modelPreset,
  }) as MerchantProfile;
};

export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
  if (!storage) {
    console.warn("Storage initialized değil, base64 fallback kullanılıyor.");
    return base64Data;
  }

  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, "data_url");
  return getDownloadURL(storageRef);
};

const uploadImageIfNeeded = async (base64OrUrl: string, path: string): Promise<string> => {
  if (!base64OrUrl) return base64OrUrl;
  if (!base64OrUrl.startsWith("data:")) return base64OrUrl;

  const uploaded = await uploadImageToStorage(base64OrUrl, path);
  if (uploaded.startsWith("data:")) {
    throw new Error("Görsel yüklenemedi. Lütfen tekrar deneyin.");
  }
  return uploaded;
};

export const saveMerchantProfile = async (profile: MerchantProfile): Promise<void> => {
  if (!db) return;
  if (!profile.uid) throw new Error("Mağaza kimliği bulunamadı.");

  const safeName = profile.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "merchant";
  const logoUrl = profile.logoUrl
    ? await uploadImageIfNeeded(profile.logoUrl, `users/${profile.uid}/branding/${safeName}_${Date.now()}`)
    : undefined;

  const mergedProfile: MerchantProfile = {
    ...profile,
    logoUrl,
  };

  const privateProfileData = cleanData({
    uid: mergedProfile.uid,
    role: "merchant",
    email: mergedProfile.email,
    name: mergedProfile.name,
    logoUrl: mergedProfile.logoUrl,
    description: mergedProfile.description,
    instagramUrl: mergedProfile.instagramUrl,
    defaultShopUrl: mergedProfile.defaultShopUrl,
    whatsappNumber: mergedProfile.whatsappNumber,
    credits: mergedProfile.credits,
    modelPreset: mergedProfile.modelPreset,
    status: mergedProfile.status || "active",
  });

  const publicProfileData = cleanData({
    ...toPublicMerchantProfile(mergedProfile),
  });

  await Promise.all([
    setDoc(doc(db, COLLECTION_PRIVATE_PROFILE, profile.uid), privateProfileData, { merge: true }),
    setDoc(doc(db, COLLECTION_PUBLIC_PROFILE, profile.uid), publicProfileData, { merge: true }),
  ]);
};

export const getMerchantPublicProfileByUid = async (
  uid: string
): Promise<MerchantPublicProfile | null> => {
  if (!db || !uid) return null;

  const publicDoc = await getDoc(doc(db, COLLECTION_PUBLIC_PROFILE, uid));
  if (publicDoc.exists()) {
    return cleanData({
      uid,
      ...publicDoc.data(),
    }) as MerchantPublicProfile;
  }

  const privateDoc = await getDoc(doc(db, COLLECTION_PRIVATE_PROFILE, uid));
  if (!privateDoc.exists()) return null;

  const fallback = mergeMerchantDocs(uid, privateDoc.data() as MerchantProfile, null);
  return fallback ? toPublicMerchantProfile(fallback) : null;
};

export const getMerchantProfileByUid = async (uid: string): Promise<MerchantProfile | null> => {
  if (!db || !uid) return null;

  const [privateDoc, publicDoc] = await Promise.all([
    getDoc(doc(db, COLLECTION_PRIVATE_PROFILE, uid)),
    getDoc(doc(db, COLLECTION_PUBLIC_PROFILE, uid)),
  ]);

  if (!privateDoc.exists() && !publicDoc.exists()) return null;

  return mergeMerchantDocs(
    uid,
    privateDoc.exists() ? (privateDoc.data() as Partial<MerchantProfile>) : null,
    publicDoc.exists() ? (publicDoc.data() as Partial<MerchantPublicProfile>) : null
  );
};

export const getMerchantProfile = async (): Promise<MerchantProfile | null> => {
  if (!auth?.currentUser?.uid) return null;
  return getMerchantProfileByUid(auth.currentUser.uid);
};

export const addGarmentToUserInventory = async (uid: string, garment: Garment): Promise<string> => {
  if (!db) return garment.id;

  let imageUrl = garment.imageUrl;
  if (imageUrl.startsWith("data:")) {
    const safeName = garment.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "garment";
    imageUrl = await uploadImageIfNeeded(imageUrl, `users/${uid}/garments/${Date.now()}_${safeName}`);
  }

  const userGarmentsRef = collection(db, COLLECTION_PRIVATE_PROFILE, uid, COLLECTION_GARMENTS);
  const docRef = doc(userGarmentsRef);

  const garmentData = cleanData({
    ...garment,
    id: docRef.id,
    merchantUid: uid,
    imageUrl,
  });

  await setDoc(docRef, garmentData);
  return docRef.id;
};

export const getUserInventory = async (uid: string): Promise<Garment[]> => {
  if (!db || !uid) return [];

  const userGarmentsRef = collection(db, COLLECTION_PRIVATE_PROFILE, uid, COLLECTION_GARMENTS);
  const querySnapshot = await getDocs(userGarmentsRef);

  return querySnapshot.docs.map((snapshot) => ({
    ...(snapshot.data() as Garment),
    id: snapshot.id,
    merchantUid: (snapshot.data() as Garment).merchantUid || uid,
  }));
};

export const getGarmentsByMerchant = async (uid: string): Promise<Garment[]> => {
  return getUserInventory(uid);
};

export const getGarmentsFromDb = async (): Promise<Garment[]> => {
  if (!db) return [];

  try {
    const garmentsQuery = query(collectionGroup(db, COLLECTION_GARMENTS));
    const querySnapshot = await getDocs(garmentsQuery);

    return querySnapshot.docs.map((snapshot) => {
      const garment = snapshot.data() as Garment;
      return {
        ...garment,
        id: snapshot.id,
        merchantUid: garment.merchantUid || snapshot.ref.parent.parent?.id || "",
      };
    });
  } catch (error) {
    console.error("Error fetching garments:", error);
    return [];
  }
};

export const getGarmentById = async (id: string): Promise<Garment | null> => {
  if (!db || !id) return null;

  try {
    const garmentsQuery = query(collectionGroup(db, COLLECTION_GARMENTS));
    const querySnapshot = await getDocs(garmentsQuery);
    const match = querySnapshot.docs.find((snapshot) => snapshot.id === id);

    if (!match) return null;

    const garment = match.data() as Garment;
    return {
      ...garment,
      id: match.id,
      merchantUid: garment.merchantUid || match.ref.parent.parent?.id || "",
    };
  } catch (error) {
    console.error("Error fetching garment:", error);
    return null;
  }
};

export const deleteGarmentFromUserInventory = async (uid: string, itemId: string): Promise<boolean> => {
  if (!db) return false;

  await deleteDoc(doc(db, COLLECTION_PRIVATE_PROFILE, uid, COLLECTION_GARMENTS, itemId));
  return true;
};

export const updateMerchantCredits = async (uid: string, newCredits: number): Promise<boolean> => {
  if (!db || !uid) return false;

  await setDoc(
    doc(db, COLLECTION_PRIVATE_PROFILE, uid),
    { credits: newCredits },
    { merge: true }
  );
  return true;
};

export const registerMerchant = async (
  email: string,
  pass: string,
  name: string
): Promise<MerchantProfile> => {
  if (!auth || !db) throw new Error("Firebase initialized değil.");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const newProfile: MerchantProfile = {
      ...DEFAULT_PROFILE,
      uid: user.uid,
      email: user.email || email,
      name,
      role: "merchant",
      status: "active",
    };

    await saveMerchantProfile(newProfile);
    return newProfile;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const repairedProfile = await getMerchantProfileByUid(userCredential.user.uid);

        if (repairedProfile) {
          return repairedProfile;
        }

        const newProfile: MerchantProfile = {
          ...DEFAULT_PROFILE,
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          name,
          role: "merchant",
          status: "active",
        };

        await saveMerchantProfile(newProfile);
        return newProfile;
      } catch {
        throw error;
      }
    }

    throw error;
  }
};

export const registerCustomer = async (email: string, pass: string): Promise<CustomerProfile> => {
  if (!auth || !db) throw new Error("Firebase initialized değil.");

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const newCustomer: CustomerProfile = {
    uid: user.uid,
    role: "customer",
    email: user.email || email,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "customers", user.uid), cleanData(newCustomer));
  return newCustomer;
};

export const loginUser = async (
  email: string,
  pass: string
): Promise<{ user: any; role: UserRole; profile: MerchantProfile | CustomerProfile }> => {
  if (!auth || !db) throw new Error("Firebase initialized değil.");

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const merchantProfile = await getMerchantProfileByUid(user.uid);
  if (merchantProfile) {
    return { user, role: "merchant", profile: merchantProfile };
  }

  const customerDoc = await getDoc(doc(db, "customers", user.uid));
  if (customerDoc.exists()) {
    return { user, role: "customer", profile: customerDoc.data() as CustomerProfile };
  }

  throw new Error("Kullanıcı profili bulunamadı.");
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const isFirebaseConfigured = () => !!db;
