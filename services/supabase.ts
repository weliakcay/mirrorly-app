
import { createClient } from '@supabase/supabase-js';
import { Garment, MerchantProfile } from '../types';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Constants
const TABLE_GARMENTS = 'garments';
const TABLE_PROFILES = 'merchant_profiles';
const BUCKET_IMAGES = 'images';

export const isSupabaseConfigured = () => !!supabase;

/**
 * Uploads a Base64 image to Supabase Storage and returns the public URL.
 */
export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
    if (!supabase) return base64Data;

    try {
        // Convert Base64 to Blob
        const base64Response = await fetch(base64Data);
        const blob = await base64Response.blob();

        const { data, error } = await supabase.storage
            .from(BUCKET_IMAGES)
            .upload(path, blob, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_IMAGES)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw error;
    }
};

/**
 * Saves a new garment to Supabase.
 */
export const addGarmentToDb = async (garment: Garment): Promise<string> => {
    if (!supabase) return garment.id;

    try {
        let imageUrl = garment.imageUrl;

        // Upload image if it's base64
        if (imageUrl.startsWith('data:')) {
            const safeName = garment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `garments/${Date.now()}_${safeName}.png`;
            imageUrl = await uploadImageToStorage(imageUrl, fileName);
        }

        const { data, error } = await supabase
            .from(TABLE_GARMENTS)
            .insert([
                {
                    id: garment.id, // Use the ID generated on client or let DB generate one (if we omit)
                    name: garment.name,
                    description: garment.description,
                    price: garment.price,
                    imageUrl: imageUrl,
                    boutiqueName: garment.boutiqueName,
                    shopUrl: garment.shopUrl
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    } catch (error) {
        console.error("Supabase DB Insert Error:", error);
        throw error;
    }
};

/**
 * Fetches all garments.
 */
export const getGarmentsFromDb = async (): Promise<Garment[]> => {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from(TABLE_GARMENTS)
            .select('*');

        if (error) throw error;

        // Map snake_case DB columns to camelCase types if necessary
        // Assuming DB columns match Garment type for simplicity or are mapped here
        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl, // Ensure DB column is 'imageUrl' or map from 'image_url'
            price: item.price,
            boutiqueName: item.boutiqueName,
            shopUrl: item.shopUrl
        })) as Garment[];
    } catch (error) {
        console.error("Supabase Fetch Error:", error);
        return [];
    }
};

/**
 * Fetches a single garment by ID.
 */
export const getGarmentById = async (id: string): Promise<Garment | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from(TABLE_GARMENTS)
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            price: data.price,
            boutiqueName: data.boutiqueName,
            shopUrl: data.shopUrl
        } as Garment;
    } catch (error) {
        console.error("Supabase Get By ID Error:", error);
        return null;
    }
};

/**
 * Saves or Updates merchant profile.
 */
export const saveMerchantProfile = async (profile: MerchantProfile): Promise<void> => {
    if (!supabase) return;

    try {
        let logoUrl = profile.logoUrl;
        if (logoUrl && logoUrl.startsWith('data:')) {
            const fileName = `branding/logo_${Date.now()}.png`;
            logoUrl = await uploadImageToStorage(logoUrl, fileName);
        }

        // We use a single row for the profile for now (ID: 1 or 'main')
        // Upsert based on a fixed ID
        const { error } = await supabase
            .from(TABLE_PROFILES)
            .upsert({
                id: 'main_profile', // Fixed ID for single user demo
                name: profile.name,
                logoUrl: logoUrl,
                paymentLink: profile.paymentLink,
                geminiApiKey: profile.geminiApiKey
            });

        if (error) throw error;
    } catch (error) {
        console.error("Supabase Profile Save Error:", error);
        throw error;
    }
};

/**
 * Get merchant profile.
 */
export const getMerchantProfile = async (): Promise<MerchantProfile | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from(TABLE_PROFILES)
            .select('*')
            .eq('id', 'main_profile')
            .single();

        if (error) return null;

        return {
            name: data.name,
            logoUrl: data.logoUrl,
            paymentLink: data.paymentLink,
            geminiApiKey: data.geminiApiKey
        } as MerchantProfile;
    } catch (error) {
        console.error("Supabase Profile Fetch Error:", error);
        return null;
    }
};
