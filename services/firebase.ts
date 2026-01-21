import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, getDocs, setDoc, deleteDoc, collectionGroup, query, where, documentId } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Garment, MerchantProfile, CustomerProfile, UserRole, DEFAULT_PROFILE } from "../types";

// ------------------------------------------------------------------
// Firebase Configuration
// ------------------------------------------------------------------

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ------------------------------------------------------------------

// Initialize Firebase (Singleton Pattern)
// This prevents "Firebase App named '[DEFAULT]' already exists" errors
let app;
let db: any;
let storage: any;
let auth: any;

try {
    if (firebaseConfig.apiKey) {
        // Check if an app is already initialized
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        auth = getAuth(app);
        console.log("Firebase başarıyla başlatıldı (Singleton).");
    } else {
        console.warn("UYARI: Firebase API anahtarları eksik! .env.local dosyasını kontrol edin.");
    }
} catch (e) {
    console.error("Firebase başlatma hatası:", e);
}

// Export initialization for usage in other files
export { auth, db, storage };

// Collection References
const COLLECTION_GARMENTS = "garments";
const COLLECTION_PROFILE = "merchant_profiles";
const PROFILE_DOC_ID = "main_profile"; // Legacy single-user ID

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
/**
 * Fetches all garments from ALL merchants (Global Marketplace View).
 * Uses collectionGroup query.
 */
export const getGarmentsFromDb = async (): Promise<Garment[]> => {
    if (!db) return [];

    try {
        // Query all collections named 'garments' across the entire database
        const garmentsQuery = query(collectionGroup(db, COLLECTION_GARMENTS));
        const querySnapshot = await getDocs(garmentsQuery);

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
/**
 * Fetches a single garment by ID from ANY merchant.
 * Uses collectionGroup query.
 */
export const getGarmentById = async (id: string): Promise<Garment | null> => {
    if (!db) return null;

    try {
        // Since we don't know the parent UID, we must search globally
        // Note: ID must be stored as a field in the document for this to work with 'where'
        // OR we just assume unique IDs and search.
        // Actually, Document ID is usually not a queryable field unless we strictly use field path.
        // However, we are storing 'id' inside the data object too in addGarment functions.

        // Wait! We usually set id in the object only AFTER retrieval in basic firebase patterns.
        // If we want to find by ID efficiently, we should query where 'id' == id (field) or documentId() == id.

        // Strategy: Query collectionGroup where documentId == id
        // Note: FieldPath.documentId() works in collectionGroup queries

        const garmentsQuery = query(collectionGroup(db, COLLECTION_GARMENTS));
        // We can't easily filter by documentID in collectionGroup across different parents efficiently without exact path
        // BUT, if we iterate or use a specific index. 
        // Better Approach: Fetch all (expensive?) or assume we store ID as a field.
        // In this project, `addGarmentToDb` stores `...garment` which includes `id`.

        // Strategy: Query collectionGroup using FieldPath.documentId()
        // This ensures we find the document by its actual Firestore Key (which is what we use in the app URLs)

        const q = query(collectionGroup(db, COLLECTION_GARMENTS), where(documentId(), '==', id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            return { id: docSnap.id, ...docSnap.data() } as Garment;
        }

        // Fallback: Check root collection (Legacy)
        const rootDocRef = doc(db, COLLECTION_GARMENTS, id);
        const rootDocSnap = await getDoc(rootDocRef);
        if (rootDocSnap.exists()) {
            return { id: rootDocSnap.id, ...rootDocSnap.data() } as Garment;
        }

        return null;
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

/**
 * Deletes a garment from Firestore.
 */
export const deleteGarmentFromDb = async (id: string): Promise<boolean> => {
    if (!db) return false;

    try {
        const docRef = doc(db, COLLECTION_GARMENTS, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting garment:", error);
        throw error;
    }
};

/**
 * Updates merchant credits (decrement by 1 or set specific value).
 */
export const updateMerchantCredits = async (newCredits: number): Promise<boolean> => {
    if (!db) return false;

    try {
        const docRef = doc(db, COLLECTION_PROFILE, PROFILE_DOC_ID);
        await setDoc(docRef, { credits: newCredits }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating credits:", error);
        return false;
    }
};

// ------------------------------------------------------------------
// MULTI-TENANT HELPERS (New)
// ------------------------------------------------------------------

/**
 * Adds a garment to a specific user's sub-collection.
 * Path: merchant_profiles/{uid}/garments/{docId}
 */
export const addGarmentToUserInventory = async (uid: string, garment: Garment): Promise<string> => {
    if (!db) return garment.id;

    try {
        // 1. Upload Image logic (same as generic)
        let imageUrl = garment.imageUrl;
        if (imageUrl.startsWith('data:')) {
            const safeName = garment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `users/${uid}/garments/${Date.now()}_${safeName}`;
            imageUrl = await uploadImageToStorage(imageUrl, fileName);
        }

        // 2. Save location: user specific sub-collection
        const garmentData = cleanData({ ...garment, imageUrl });
        const userGarmentsRef = collection(db, COLLECTION_PROFILE, uid, COLLECTION_GARMENTS);
        const docRef = await addDoc(userGarmentsRef, garmentData);

        return docRef.id;

    } catch (error) {
        console.error("Error adding garment to user:", error);
        throw error;
    }
};

/**
 * Fetches garments for a specific user.
 */
export const getUserInventory = async (uid: string): Promise<Garment[]> => {
    if (!db) return [];

    try {
        const userGarmentsRef = collection(db, COLLECTION_PROFILE, uid, COLLECTION_GARMENTS);
        const querySnapshot = await getDocs(userGarmentsRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Garment));
    } catch (error) {
        console.error("Error fetching user inventory:", error);
        return [];
    }
};

/**
 * Deletes a garment from a specific user's inventory.
 */
export const deleteGarmentFromUserInventory = async (uid: string, itemId: string): Promise<boolean> => {
    if (!db) return false;

    try {
        const docRef = doc(db, COLLECTION_PROFILE, uid, COLLECTION_GARMENTS, itemId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting user garment:", error);
        throw error;
    }
};

// ------------------------------------------------------------------
// AUTHENTICATION FUNCTIONS (New)
// ------------------------------------------------------------------

/**
 * Registers a new Merchant.
 * Creates Auth user AND a document in 'merchant_profiles'.
 */
export const registerMerchant = async (email: string, pass: string, name: string): Promise<MerchantProfile> => {
    if (!auth || !db) throw new Error("Firebase initialized değil.");

    try {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 2. Create Merchant Profile
        const newProfile: MerchantProfile = {
            ...DEFAULT_PROFILE,
            uid: user.uid,
            email: user.email || email,
            name: name,
            role: 'merchant',
            credits: 10 // Default starter credits
        };

        // 3. Save to Firestore (merchant_profiles/{uid})
        // Use cleanData to remove undefined fields (like logoUrl from DEFAULT_PROFILE)
        const profileData = cleanData(newProfile);
        await setDoc(doc(db, COLLECTION_PROFILE, user.uid), profileData);

        return newProfile;
    } catch (error: any) {
        // --- REPAIR FLOW ---
        // If email exists (due to failed previous attempt), try to sign in and check for profile.
        if (error.code === 'auth/email-already-in-use') {
            console.warn("Email exists, checking for orphaned user state...");
            try {
                // Try to sign in with provided password
                const userCredential = await signInWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                // Check if profile exists
                const existingProfile = await getDoc(doc(db, COLLECTION_PROFILE, user.uid));
                if (!existingProfile.exists()) {
                    console.info("Orphaned user found. Repairing profile...");

                    // Create Merchant Profile (Repair)
                    const newProfile: MerchantProfile = {
                        ...DEFAULT_PROFILE,
                        uid: user.uid,
                        email: user.email || email,
                        name: name,
                        role: 'merchant',
                        credits: 10
                    };

                    const profileData = cleanData(newProfile);
                    await setDoc(doc(db, COLLECTION_PROFILE, user.uid), profileData);

                    return newProfile;
                } else {
                    // Profile exists, so it's a genuine "User already exists" error
                    throw error;
                }
            } catch (signinError) {
                // SignIn failed (wrong password?) or other error -> throw original "email in use"
                console.error("Repair failed:", signinError);
                throw error;
            }
        }

        console.error("Register Merchant Error:", error);
        throw error;
    }
};

/**
 * Registers a new Customer.
 * Creates Auth user AND a document in 'customers'.
 */
export const registerCustomer = async (email: string, pass: string): Promise<CustomerProfile> => {
    if (!auth || !db) throw new Error("Firebase initialized değil.");

    try {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 2. Create Customer Profile
        const newCustomer: CustomerProfile = {
            uid: user.uid,
            role: 'customer',
            email: user.email || email,
            createdAt: Date.now()
        };

        // 3. Save to Firestore (customers/{uid})
        // Use cleanData to remove undefined fields
        const customerData = cleanData(newCustomer);
        await setDoc(doc(db, "customers", user.uid), customerData);

        return newCustomer;
    } catch (error: any) {
        console.error("Register Customer Error:", error);
        throw error;
    }
};

/**
 * Logs in a user (Merchant or Customer) and determines their role.
 */
export const loginUser = async (email: string, pass: string): Promise<{ user: any, role: UserRole, profile: any }> => {
    if (!auth || !db) throw new Error("Firebase initialized değil.");

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Check if Merchant
        const merchantDoc = await getDoc(doc(db, COLLECTION_PROFILE, user.uid));
        if (merchantDoc.exists()) {
            return { user, role: 'merchant', profile: merchantDoc.data() as MerchantProfile };
        }

        // Check if Customer
        const customerDoc = await getDoc(doc(db, "customers", user.uid));
        if (customerDoc.exists()) {
            return { user, role: 'customer', profile: customerDoc.data() as CustomerProfile };
        }

        // Fallback: If no profile found (maybe created manually via console?), default to restricted or error
        throw new Error("Kullanıcı profili bulunamadı.");

    } catch (error: any) {
        console.error("Login Error:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    if (!auth) return;
    await signOut(auth);
};

export const getMerchantProfileByUid = async (uid: string): Promise<MerchantProfile | null> => {
    if (!db) return null;
    try {
        const docSnap = await getDoc(doc(db, COLLECTION_PROFILE, uid));
        return docSnap.exists() ? (docSnap.data() as MerchantProfile) : null;
    } catch (e) {
        console.error("Get Profile Error:", e);
        return null;
    }
};

export const isFirebaseConfigured = () => !!db;