
export enum AppState {
  SPLASH = 'SPLASH',
  LANDING = 'LANDING', 
  GARMENT_VIEW = 'GARMENT_VIEW',
  PHOTO_INPUT = 'PHOTO_INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  MERCHANT_DASHBOARD = 'MERCHANT_DASHBOARD',
  CUSTOMER_HISTORY = 'CUSTOMER_HISTORY', // New State
}

export interface MerchantProfile {
  name: string;
  logoUrl?: string; 
  paymentLink?: string; 
  geminiApiKey?: string; 
}

export interface Garment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  boutiqueName?: string; 
  shopUrl?: string; 
}

export interface ProcessingResult {
  imageUrl: string;
  success: boolean;
  message?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  garment: Garment;
  resultImageUrl: string;
}

export interface UserSession {
  userPhoto: string | null; 
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
  logoUrl: undefined, 
  paymentLink: '',
  geminiApiKey: ''
};
