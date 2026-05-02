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
  ADMIN_PANEL = 'ADMIN_PANEL',
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

export interface MerchantCreditPack {
  id: string;
  packType: 'starter' | 'pro' | 'scale';
  label: string;
  credits: number;
  description: string;
  checkoutUrl?: string;
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
  waitTime: string;
}> = [
  {
    value: 'economy',
    label: 'Ekonomik',
    description: 'Hizli ve daha uygun maliyetli denemeler icin giris seviyesi secim.',
    badge: 'Uygun fiyat',
    tool: 'GPT Image 1.5',
    cost: 'Yakl. 1 kredi / deneme',
    creditCost: 1,
    waitTime: '~10-20 sn',
  },
  {
    value: 'balanced',
    label: 'Dengeli',
    description: 'Kalite ve urun uyumu dengesinde en guvenli varsayilan secim.',
    badge: 'Onerilen',
    tool: 'Nano Banana 2 · 1K',
    cost: 'Yakl. 2 kredi / deneme',
    creditCost: 2,
    waitTime: '~25-40 sn',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Daha premium sonuc ve daha guclu gorsel isleme icin yuksek kalite mod.',
    badge: 'Yuksek kalite',
    tool: 'Flux 2 Pro',
    cost: 'Yakl. 3 kredi / deneme',
    creditCost: 3,
    waitTime: '~45-70 sn',
  },
];

export const DEFAULT_CUSTOMER_CREDITS = 3;

export const CUSTOMER_CREDIT_PACKAGES: CustomerCreditPack[] = [
  {
    id: 'starter',
    label: 'Look Pack',
    credits: 12,
    description: 'Hizli denemeler ve ilk kombinler icin en hafif kredi paketi.',
  },
  {
    id: 'standard',
    label: 'Style Pack',
    credits: 30,
    description: 'Kesfette daha uzun kalip farkli urunler denemek isteyenler icin dengeli paket.',
  },
  {
    id: 'plus',
    label: 'Plus Paket',
    credits: 75,
    description: 'Sik kullanan musteriler icin en uzun sureli ve en avantajli kredi paketi.',
  },
];

export const MERCHANT_CREDIT_PACKAGES: MerchantCreditPack[] = [
  {
    id: 'merchant_starter',
    packType: 'starter',
    label: 'Pilot Paket',
    credits: 300,
    description: 'Pilot surecte QR akisini test eden butiklere uygun giris seviyesi kredi paketi.',
  },
  {
    id: 'merchant_pro',
    packType: 'pro',
    label: 'Growth Paket',
    credits: 1200,
    description: 'Magaza ici yogun trafik alan ve aylik duzenli deneme toplayan butikler icin.',
  },
  {
    id: 'merchant_scale',
    packType: 'scale',
    label: 'Scale Paket',
    credits: 5000,
    description: 'Coklu koleksiyonla calisan, yogun kullanim alan magazalar icin hacimli paket.',
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
  currency: 'TRY',
};
