export enum AppState {
  SPLASH = 'SPLASH',
  LANDING = 'LANDING', // New state for users visiting without a QR code
  GARMENT_VIEW = 'GARMENT_VIEW',
  PHOTO_INPUT = 'PHOTO_INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  MERCHANT_DASHBOARD = 'MERCHANT_DASHBOARD',
}

export interface MerchantProfile {
  name: string;
  logoUrl?: string; // Base64 or URL
  paymentLink?: string; // Stripe, Shopify link etc.
}

export interface Garment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  // boutiqueName is now derived from the global profile, but kept for fallback
  boutiqueName?: string; 
  shopUrl?: string; // Optional URL for direct purchasing
}

export interface ProcessingResult {
  imageUrl: string;
  success: boolean;
  message?: string;
}

export interface UserSession {
  userPhoto: string | null; // Base64
  selectedGarment: Garment | null;
  result: ProcessingResult | null;
}

// Mock Data for Demo Purposes
export const MOCK_GARMENTS: Garment[] = [
  {
    id: 'g1',
    name: 'Silk Evening Gown',
    description: 'A midnight blue silk gown with elegant draping.',
    imageUrl: 'https://picsum.photos/600/800?random=1',
    price: 450,
    boutiqueName: 'Lumière Boutique',
    shopUrl: 'https://example.com/buy/g1'
  },
  {
    id: 'g2',
    name: 'Cashmere Trench Coat',
    description: 'Classic beige trench coat, 100% cashmere.',
    imageUrl: 'https://picsum.photos/600/800?random=2',
    price: 890,
    boutiqueName: 'Lumière Boutique',
  }
];

export const DEFAULT_PROFILE: MerchantProfile = {
  name: 'Lumière Boutique',
  logoUrl: undefined, // Will default to text if undefined
  paymentLink: ''
};