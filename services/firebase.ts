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
  getRedirectResult,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  CatalogItem,
  CustomerProfile,
  DEFAULT_PROFILE,
  FavoriteItem,
  Garment,
  HistoryItem,
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
const COLLECTION_CUSTOMER_PROFILE = "customer_profiles";
const COLLECTION_CUSTOMER_HISTORY = "history";
const COLLECTION_CUSTOMER_FAVORITES = "favorites";

const isPermissionError = (error: any) => {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return (
    text.includes("permission") ||
    text.includes("insufficient") ||
    text.includes("unauthorized")
  );
};

const mapAuthErrorMessage = (error: any) => {
  const code = String(error?.code || "");

  switch (code) {
    case "auth/unauthorized-domain":
      return "Bu alan adi Firebase Google girisi icin yetkilendirilmemis.";
    case "auth/operation-not-allowed":
      return "Firebase tarafinda Google girisi henuz aktif degil.";
    case "auth/popup-blocked":
      return "Popup engellendi. Tekrar deneyin veya ayni linki yeni sekmede acin.";
    case "auth/popup-closed-by-user":
      return "Google giris penceresi kapatildi.";
    default:
      return error?.message || "Google girisi basarisiz oldu.";
  }
};

const cleanData = <T extends Record<string, any>>(data: T): T => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

const readMimeTypeFromDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || "image/jpeg";
};

const optimizeImageDataUrl = async (
  dataUrl: string,
  options?: {
    maxDimension?: number;
    quality?: number;
    outputMimeType?: string;
  }
) => {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const {
    maxDimension = 1280,
    quality = 0.82,
    outputMimeType = "image/jpeg",
  } = options || {};

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.src = dataUrl;

    image.onload = () => {
      let width = image.width;
      let height = image.height;

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL(outputMimeType, quality));
    };

    image.onerror = () => resolve(dataUrl);
  });
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

const googleProvider = auth
  ? new GoogleAuthProvider()
  : null;

if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
}

const upsertCustomerProfile = async (profile: CustomerProfile): Promise<CustomerProfile> => {
  if (!db) throw new Error("Firebase initialized değil.");

  const normalizedProfile: CustomerProfile = cleanData({
    ...profile,
    role: "customer",
    updatedAt: Date.now(),
  }) as CustomerProfile;

  try {
    await setDoc(
      doc(db, COLLECTION_CUSTOMER_PROFILE, normalizedProfile.uid),
      normalizedProfile,
      { merge: true }
    );
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer profile write skipped:", error?.message || error);
      return normalizedProfile;
    }

    throw error;
  }

  return normalizedProfile;
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

  const optimizedFallback = await optimizeImageDataUrl(base64OrUrl, {
    maxDimension: path.includes("/branding/") ? 512 : 1280,
    quality: path.includes("/branding/") ? 0.9 : 0.8,
    outputMimeType: path.includes("/branding/") ? readMimeTypeFromDataUrl(base64OrUrl) : "image/jpeg",
  });

  try {
    const uploaded = await uploadImageToStorage(optimizedFallback, path);
    if (!uploaded.startsWith("data:")) {
      return uploaded;
    }
  } catch (error: any) {
    console.warn("Storage upload fallback activated:", error?.code || error?.message || error);
  }

  return optimizedFallback;
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

  await setDoc(doc(db, COLLECTION_PRIVATE_PROFILE, profile.uid), privateProfileData, { merge: true });

  try {
    await setDoc(doc(db, COLLECTION_PUBLIC_PROFILE, profile.uid), publicProfileData, { merge: true });
  } catch (error: any) {
    console.warn("merchant_public write skipped:", error?.message || error);
  }
};

export const getMerchantPublicProfileByUid = async (
  uid: string
): Promise<MerchantPublicProfile | null> => {
  if (!db || !uid) return null;

  try {
    const publicDoc = await getDoc(doc(db, COLLECTION_PUBLIC_PROFILE, uid));
    if (publicDoc.exists()) {
      return cleanData({
        uid,
        ...publicDoc.data(),
      }) as MerchantPublicProfile;
    }
  } catch (error: any) {
    console.warn("merchant_public read skipped:", error?.message || error);
  }

  if (auth?.currentUser?.uid !== uid) {
    return null;
  }

  try {
    const privateDoc = await getDoc(doc(db, COLLECTION_PRIVATE_PROFILE, uid));
    if (!privateDoc.exists()) return null;

    const fallback = mergeMerchantDocs(uid, privateDoc.data() as MerchantProfile, null);
    return fallback ? toPublicMerchantProfile(fallback) : null;
  } catch (error: any) {
    console.warn("merchant private fallback skipped:", error?.message || error);
    return null;
  }
};

export const getMerchantProfileByUid = async (uid: string): Promise<MerchantProfile | null> => {
  if (!db || !uid) return null;

  let privateDoc: any = null;
  let publicDoc: any = null;

  try {
    privateDoc = await getDoc(doc(db, COLLECTION_PRIVATE_PROFILE, uid));
  } catch (error: any) {
    console.warn("merchant private read failed:", error?.message || error);
  }

  try {
    publicDoc = await getDoc(doc(db, COLLECTION_PUBLIC_PROFILE, uid));
  } catch (error: any) {
    console.warn("merchant public read skipped:", error?.message || error);
  }

  if ((!privateDoc || !privateDoc.exists()) && (!publicDoc || !publicDoc.exists())) return null;

  return mergeMerchantDocs(
    uid,
    privateDoc?.exists() ? (privateDoc.data() as Partial<MerchantProfile>) : null,
    publicDoc?.exists() ? (publicDoc.data() as Partial<MerchantPublicProfile>) : null
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

export const updateGarmentInUserInventory = async (
  uid: string,
  garment: Garment
): Promise<void> => {
  if (!db) return;
  if (!uid) throw new Error("Magaza kimligi bulunamadi.");
  if (!garment.id) throw new Error("Urun kimligi bulunamadi.");

  let imageUrl = garment.imageUrl;
  if (imageUrl.startsWith("data:")) {
    const safeName = garment.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "garment";
    imageUrl = await uploadImageIfNeeded(imageUrl, `users/${uid}/garments/${Date.now()}_${safeName}`);
  }

  const garmentRef = doc(db, COLLECTION_PRIVATE_PROFILE, uid, COLLECTION_GARMENTS, garment.id);
  const garmentData = cleanData({
    ...garment,
    id: garment.id,
    merchantUid: uid,
    imageUrl,
  });

  await setDoc(garmentRef, garmentData, { merge: true });
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

export const getPublicCatalog = async (): Promise<CatalogItem[]> => {
  const garments = await getGarmentsFromDb();
  if (garments.length === 0) return [];

  const uniqueMerchantIds = [...new Set(garments.map((garment) => garment.merchantUid).filter(Boolean))];
  const merchantEntries = await Promise.all(
    uniqueMerchantIds.map(async (uid) => [uid, await getMerchantPublicProfileByUid(uid)] as const)
  );

  const merchantMap = new Map<string, MerchantPublicProfile | null>(merchantEntries);

  const hasUsableImage = (imageUrl?: string) => {
    const normalized = imageUrl?.trim();
    if (!normalized) return false;

    return (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('data:image/')
    );
  };

  return garments
    .filter((garment) => hasUsableImage(garment.imageUrl))
    .map((garment) => {
      const merchant =
        merchantMap.get(garment.merchantUid) ||
        ({
          uid: garment.merchantUid || 'unknown-merchant',
          name: garment.boutiqueName || 'Mirrorly Boutique',
        } as MerchantPublicProfile);

      return {
        garment,
        merchant,
      };
    })
    .filter((item) => !!item.merchant?.name)
    .sort((a, b) => a.garment.name.localeCompare(b.garment.name));
};

export const saveCustomerHistoryItem = async (
  uid: string,
  garment: Garment,
  resultImageUrl: string
): Promise<HistoryItem | null> => {
  if (!db || !uid) return null;

  const historyRef = collection(db, COLLECTION_CUSTOMER_PROFILE, uid, COLLECTION_CUSTOMER_HISTORY);
  const docRef = doc(historyRef);
  const historyItem: HistoryItem = {
    id: docRef.id,
    timestamp: Date.now(),
    garment,
    resultImageUrl,
  };

  try {
    await setDoc(docRef, cleanData(historyItem));
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer history write skipped:", error?.message || error);
      return historyItem;
    }

    throw error;
  }
  return historyItem;
};

export const getCustomerHistoryItems = async (uid: string): Promise<HistoryItem[]> => {
  if (!db || !uid) return [];

  try {
    const historyRef = collection(db, COLLECTION_CUSTOMER_PROFILE, uid, COLLECTION_CUSTOMER_HISTORY);
    const snapshot = await getDocs(historyRef);

    return snapshot.docs
      .map((item) => cleanData(item.data() as HistoryItem) as HistoryItem)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer history read skipped:", error?.message || error);
      return [];
    }

    throw error;
  }
};

export const clearCustomerHistoryItems = async (uid: string): Promise<void> => {
  if (!db || !uid) return;

  try {
    const historyRef = collection(db, COLLECTION_CUSTOMER_PROFILE, uid, COLLECTION_CUSTOMER_HISTORY);
    const snapshot = await getDocs(historyRef);
    await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer history clear skipped:", error?.message || error);
      return;
    }

    throw error;
  }
};

export const getCustomerFavorites = async (uid: string): Promise<FavoriteItem[]> => {
  if (!db || !uid) return [];

  try {
    const favoritesRef = collection(
      db,
      COLLECTION_CUSTOMER_PROFILE,
      uid,
      COLLECTION_CUSTOMER_FAVORITES
    );
    const snapshot = await getDocs(favoritesRef);

    return snapshot.docs
      .map((entry) => cleanData(entry.data() as FavoriteItem) as FavoriteItem)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer favorites read skipped:", error?.message || error);
      return [];
    }

    throw error;
  }
};

export const addCustomerFavorite = async (
  uid: string,
  item: CatalogItem
): Promise<FavoriteItem | null> => {
  if (!db || !uid) return null;

  const favoriteRef = doc(
    db,
    COLLECTION_CUSTOMER_PROFILE,
    uid,
    COLLECTION_CUSTOMER_FAVORITES,
    item.garment.id
  );

  const favorite: FavoriteItem = {
    id: item.garment.id,
    createdAt: Date.now(),
    garment: item.garment,
    merchant: item.merchant,
  };

  try {
    await setDoc(favoriteRef, cleanData(favorite), { merge: true });
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer favorite write skipped:", error?.message || error);
      return favorite;
    }

    throw error;
  }
  return favorite;
};

export const removeCustomerFavorite = async (uid: string, garmentId: string): Promise<void> => {
  if (!db || !uid || !garmentId) return;

  try {
    await deleteDoc(
      doc(db, COLLECTION_CUSTOMER_PROFILE, uid, COLLECTION_CUSTOMER_FAVORITES, garmentId)
    );
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer favorite delete skipped:", error?.message || error);
      return;
    }

    throw error;
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
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return upsertCustomerProfile(newCustomer);
};

export const getCustomerProfileByUid = async (uid: string): Promise<CustomerProfile | null> => {
  if (!db || !uid) return null;

  try {
    const customerDoc = await getDoc(doc(db, COLLECTION_CUSTOMER_PROFILE, uid));
    if (!customerDoc.exists()) {
      return null;
    }

    return cleanData(customerDoc.data() as CustomerProfile) as CustomerProfile;
  } catch (error: any) {
    if (isPermissionError(error)) {
      console.warn("customer profile read skipped:", error?.message || error);
      return null;
    }

    throw error;
  }
};

export const getCurrentCustomerProfile = async (): Promise<CustomerProfile | null> => {
  if (!auth?.currentUser?.uid) return null;
  return getCustomerProfileByUid(auth.currentUser.uid);
};

const isMobileBrowser = () =>
  typeof window !== "undefined" &&
  /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);

const mapGoogleUserToCustomerProfile = async (user: any): Promise<CustomerProfile> => {
  const existing = await getCustomerProfileByUid(user.uid);
  const now = Date.now();

  return upsertCustomerProfile({
    uid: user.uid,
    role: "customer",
    email: user.email || existing?.email || "",
    displayName: user.displayName || existing?.displayName || "",
    photoURL: user.photoURL || existing?.photoURL || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
};

export const signInCustomerWithGoogle = async (): Promise<CustomerProfile | null> => {
  if (!auth || !googleProvider) {
    throw new Error("Google girisi icin Firebase hazir degil.");
  }

  if (isMobileBrowser()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return mapGoogleUserToCustomerProfile(userCredential.user);
  } catch (error: any) {
    if (error?.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw new Error(mapAuthErrorMessage(error));
  }
};

export const consumeGoogleRedirectCustomer = async (): Promise<CustomerProfile | null> => {
  if (!auth || !googleProvider) return null;

  const result = await getRedirectResult(auth);
  if (!result?.user) {
    return null;
  }

  return mapGoogleUserToCustomerProfile(result.user);
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

  const customerProfile = await getCustomerProfileByUid(user.uid);
  if (customerProfile) {
    return { user, role: "customer", profile: customerProfile };
  }

  throw new Error("Kullanıcı profili bulunamadı.");
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const isFirebaseConfigured = () => !!db;
