import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Garment, MerchantProfile } from "../types";
let app;
let db: any;
let storage: any;

try {
    if (firebaseConfig.apiKey) {
        // Check if an app is already initialized
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log("Firebase başarıyla başlatıldı (Singleton).");
    } else {
        console.warn("UYARI: Firebase API anahtarları eksik!");
    }
} catch (e) {
    console.error("Firebase başlatma hatası:", e);
}

// Collection References
const COLLECTION_GARMENTS = "garments";
const COLLECTION_PROFILE = "merchant_profiles";
const PROFILE_DOC_ID = "main_profile";

// Helper to remove undefined fields because Firestore doesn't like them
// and throws "invalid-argument"
const cleanData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
        }
    });
    return cleaned;
};

/**
 * Uploads a Base64 image to Firebase Storage and returns the public URL.
 */
export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
    if (!storage) {
        console.warn("Storage not initialized, returning raw base64");
        return base64Data;
    }

    try {
        const storageRef = ref(storage, path);
        // 'data_url' format expects strings starting with "data:image/..."
        await uploadString(storageRef, base64Data, 'data_url');
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Storage Yükleme Hatası:", error);
        throw error;
    }
};

/**
 * Saves a new garment to Firestore.
 */
export const addGarmentToDb = async (garment: Garment): Promise<string> => {
    if (!db) return garment.id;

    try {
        // 1. Upload Image first if it's base64
        let imageUrl = garment.imageUrl;
        if (imageUrl.startsWith('data:')) {
            // Sanitize filename to avoid path issues
            const safeName = garment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `garments/${Date.now()}_${safeName}`;
            imageUrl = await uploadImageToStorage(imageUrl, fileName);

            // Safety check: If upload failed or storage missing, imageUrl might still be base64.
            // Firestore has a 1MB limit, so we shouldn't save base64 there.
            if (imageUrl.startsWith('data:')) {
                throw new Error("Görsel yüklenemedi (Storage hatası). Lütfen internet bağlantınızı kontrol edin.");
            }
        }

        // 2. Save document with sanitized data
        // Explicitly remove undefined values to prevent 'invalid-argument' errors
        const garmentData = cleanData({
            ...garment,
            imageUrl: imageUrl
        });

        const docRef = await addDoc(collection(db, COLLECTION_GARMENTS), garmentData);

        return docRef.id;
    } catch (error) {
        console.error("Veritabanı Kayıt Hatası:", error);
        throw error;
    }
};

/**
 * Fetches all garments.
 */
export const getGarmentsFromDb = async (): Promise<Garment[]> => {
    if (!db) return [];

    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_GARMENTS));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Garment));
    } catch (error) {
        console.error("Error fetching garments:", error);
        return [];
    }
};

/**
 * Fetches a single garment by ID.
 */
export const getGarmentById = async (id: string): Promise<Garment | null> => {
    if (!db) return null;

    try {
        const docRef = doc(db, COLLECTION_GARMENTS, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Garment;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching garment:", error);
        return null;
    }
};

/**
 * Saves or Updates merchant profile.
 */
export const saveMerchantProfile = async (profile: MerchantProfile): Promise<void> => {
    if (!db) return;

    try {
        // Upload logo if needed
        let logoUrl = profile.logoUrl;
        if (logoUrl && logoUrl.startsWith('data:')) {
            const fileName = `branding/logo_${Date.now()}`;
            logoUrl = await uploadImageToStorage(logoUrl, fileName);
        }

        const docRef = doc(db, COLLECTION_PROFILE, PROFILE_DOC_ID);
        // Sanitize data
        const profileData = cleanData({ ...profile, logoUrl });

        await setDoc(docRef, profileData, { merge: true });

    } catch (error) {
        console.error("Error saving profile:", error);
        throw error;
    }
};

/**
 * Get merchant profile.
 */
export const getMerchantProfile = async (): Promise<MerchantProfile | null> => {
    if (!db) return null;

    try {
        const docRef = doc(db, COLLECTION_PROFILE, PROFILE_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as MerchantProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting profile:", error);
        return null;
    }
};

export const isFirebaseConfigured = () => !!db;