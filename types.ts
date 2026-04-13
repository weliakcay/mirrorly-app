export enum AppState {
  SPLASH = 'SPLASH',
  LANDING = 'LANDING',
  DISCOVER = 'DISCOVER',
  GARMENT_VIEW = 'GARMENT_VIEW',
  PHOTO_INPUT = 'PHOTO_INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  MERCHANT_DASHBOARD = 'MERCHANT_DASHBOARD',
  CUSTOMER_HISTORY = 'CUSTOMER_HISTORY',
  CUSTOMER_AUTH = 'CUSTOMER_AUTH',
  CUSTOMER_ACCOUNT = 'CUSTOMER_ACCOUNT',
  FAVORITES = 'FAVORITES',
}

export type UserRole = 'merchant' | 'customer';
export type ModelPreset = 'economy' | 'balanced' | 'premium';

export interface MerchantPublicProfile {
  uid: string;
  name: string;
  logoUrl?: string;
  description?: string;
  instagramUrl?: string;
  defaultShopUrl?: string;
  whatsappNumber?: string;
}

export interface MerchantProfile extends MerchantPublicProfile {
  role: 'merchant';
  email?: string;
  credits: number;
  modelPreset: ModelPreset;
  status?: 'active' | 'pending';
}

export interface CustomerProfile {
  uid: string;
  role: 'customer';
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Garment {
  id: string;
  merchantUid: string;
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
  remainingCredits?: number;
  mode?: 'live' | 'demo';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  garment: Garment;
  resultImageUrl: string;
}

export interface CatalogItem {
  garment: Garment;
  merchant: MerchantPublicProfile;
}

export interface FavoriteItem extends CatalogItem {
  id: string;
  createdAt: number;
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
    merchantUid: 'demo-merchant',
    name: 'Silk Evening Gown',
    description: 'A midnight blue silk gown with elegant draping.',
    imageUrl: 'https://picsum.photos/600/800?random=1',
    price: 450,
    boutiqueName: 'Lumière Boutique',
    shopUrl: 'https://example.com/buy/g1'
  },
  {
    id: 'g2',
    merchantUid: 'demo-merchant',
    name: 'Cashmere Trench Coat',
    description: 'Classic beige trench coat, 100% cashmere.',
    imageUrl: 'https://picsum.photos/600/800?random=2',
    price: 890,
    boutiqueName: 'Lumière Boutique',
  }
];

export const MODEL_PRESET_OPTIONS: Array<{
  value: ModelPreset;
  label: string;
  description: string;
  badge: string;
  tool: string;
  cost: string;
}> = [
  {
    value: 'economy',
    label: 'Ekonomik',
    description: 'Daha uygun maliyetli, hızlı ve temel try-on denemeleri için.',
    badge: 'Uygun fiyat',
    tool: 'Flux 2 Flex · 1K',
    cost: 'Yakl. dusuk maliyet / deneme',
  },
  {
    value: 'balanced',
    label: 'Dengeli',
    description: 'Kalite ve hız arasında en güvenli varsayılan seçim.',
    badge: 'Önerilen',
    tool: 'Flux 2 Pro · 1K',
    cost: 'Yakl. orta maliyet / deneme',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Daha yüksek çözünürlük ve daha premium çıktı hedefler.',
    badge: 'Yuksek kalite',
    tool: 'Flux 2 Pro · 2K',
    cost: 'Yakl. yuksek maliyet / deneme',
  },
];

export const DEFAULT_PROFILE: MerchantProfile = {
  uid: '',
  role: 'merchant',
  email: '',
  name: 'Lumière Boutique',
  logoUrl: undefined,
  description: '',
  instagramUrl: '',
  defaultShopUrl: '',
  whatsappNumber: '',
  credits: 10,
  modelPreset: 'balanced',
  status: 'active',
};
