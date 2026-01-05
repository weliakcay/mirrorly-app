import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Garment, MerchantProfile } from "../types";

// ------------------------------------------------------------------
// Firebase Configuration
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyBWmMblwY2CCu3Qj0zVs-Iks9VDSn6o4x0",
  authDomain: "mirrorlyapp.firebaseapp.com",
  projectId: "mirrorlyapp",
  storageBucket: "mirrorlyapp.firebasestorage.app",
  messagingSenderId: "955400146750",
  appId: "1:955400146750:web:c032bddeee861cac58266f",
  measurementId: "G-11PLJPMH9V"
};

// ------------------------------------------------------------------

// Initialize Firebase
let db: any;
let storage: any;

try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log("Firebase başarıyla bağlandı!");
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

/**
 * Uploads a Base64 image to Firebase Storage and returns the public URL.
 */
export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
    if (!storage) return base64Data; 
    
    try {
        const storageRef = ref(storage, path);
        await uploadString(storageRef, base64Data, 'data_url');
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading image:", error);
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
            imageUrl = await uploadImageToStorage(imageUrl, `garments/${Date.now()}_${garment.name.replace(/\s+/g, '_')}`);
        }

        // 2. Save document
        // We use addDoc to let Firestore generate a unique ID, OR we can use the ID passed in if we want specific IDs.
        // Here we let Firestore generate it for new items.
        const docRef = await addDoc(collection(db, COLLECTION_GARMENTS), {
            ...garment,
            imageUrl: imageUrl
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding garment:", error);
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
            logoUrl = await uploadImageToStorage(logoUrl, `branding/logo_${Date.now()}`);
        }

        const docRef = doc(db, COLLECTION_PROFILE, PROFILE_DOC_ID);
        await setDoc(docRef, { ...profile, logoUrl }, { merge: true });

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