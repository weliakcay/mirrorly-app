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
  CUSTOMER_CREDITS = 'CUSTOMER_CREDITS',
}

export type UserRole = 'merchant' | 'customer';
export type ModelPreset = 'economy' | 'balanced' | 'premium';
export type Currency = 'USD' | 'EUR' | 'TRY';

export interface MerchantPublicProfile {
  uid: string;
  name: string;
  logoUrl?: string;
  description?: string;
  instagramUrl?: string;
  defaultShopUrl?: string;
  whatsappNumber?: string;
  currency?: Currency;
}

export interface MerchantProfile extends MerchantPublicProfile {
  role: 'merchant';
  email?: string;
  credits: number;
  modelPreset: ModelPreset;
  status?: 'active' | 'pending';
  subscriptionTier?: 'starter' | 'pro' | 'scale' | 'none';
}

export interface CustomerProfile {
  uid: string;
  role: 'customer';
  email: string;
  displayName?: string;
  photoURL?: string;
  credits: number;
  modelPreset?: ModelPreset;
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
  currency?: Currency;
}

export interface ProcessingResult {
  imageUrl: string;
  success: boolean;
  message?: string;
  remainingCredits?: number;
  creditOwner?: UserRole;
  creditCost?: number;
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

export interface CustomerCreditPack {
  id: string;
  label: string;
  credits: number;
  description: string;
  checkoutUrl?: string;
}

export interface CustomerCreditTransaction {
  id: string;
  type: 'welcome' | 'topup' | 'spend' | 'subscription_renew';
  credits: number;
  label: string;
  createdAt: number;
  balanceAfter?: number;
  garmentId?: string;
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
  creditCost: number;
}> = [
  {
    value: 'economy',
    label: 'Ekonomik',
    description: 'Hizli ve daha uygun maliyetli denemeler icin giris seviyesi secim.',
    badge: 'Uygun fiyat',
    tool: 'GPT Image 1.5',
    cost: 'Yakl. 1 kredi / deneme',
    creditCost: 1,
  },
  {
    value: 'balanced',
    label: 'Dengeli',
    description: 'Kalite ve urun uyumu dengesinde en guvenli varsayilan secim.',
    badge: 'Onerilen',
    tool: 'Nano Banana 2 · 1K',
    cost: 'Yakl. 2 kredi / deneme',
    creditCost: 2,
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Daha premium sonuc ve daha guclu gorsel isleme icin yuksek kalite mod.',
    badge: 'Yuksek kalite',
    tool: 'Flux 2 Pro',
    cost: 'Yakl. 3 kredi / deneme',
    creditCost: 3,
  },
];

export const DEFAULT_CUSTOMER_CREDITS = 3;

export const CUSTOMER_CREDIT_PACKAGES: CustomerCreditPack[] = [
  {
    id: 'starter',
    label: 'Mini Paket',
    credits: 5,
    description: 'Birkac hizli deneme icin uygun baslangic paketi.',
    checkoutUrl: 'https://wa.me/?text=Mirrorly%20Mini%20(5%20Kredi)%20paketi%20almak%20istiyorum.',
  },
  {
    id: 'standard',
    label: 'Standart Paket',
    credits: 12,
    description: 'Kesfet ekraninda dolasip farkli urunler denemek icin rahat secim.',
    checkoutUrl: 'https://wa.me/?text=Mirrorly%20Standart%20(12%20Kredi)%20paketi%20almak%20istiyorum.',
  },
  {
    id: 'plus',
    label: 'Plus Paket',
    credits: 28,
    description: 'Sik kullanan musteriler icin daha uzun sureli kredi paketi.',
    checkoutUrl: 'https://wa.me/?text=Mirrorly%20Plus%20(28%20Kredi)%20paketi%20almak%20istiyorum.',
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
  currency: 'USD',
};
