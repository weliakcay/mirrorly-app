import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Download,
  Image as ImageIcon,
  Instagram,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Settings,
  Share2,
  Sparkles,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Currency, Garment, MerchantProfile, MERCHANT_CREDIT_PACKAGES, MODEL_PRESET_OPTIONS, ModelPreset } from '../types';
import { buildMerchantCheckoutUrl, openMerchantCheckout } from '../services/billingService';
import { formatPrice } from '../utils/currency';
import {
  addGarmentToUserInventory,
  deleteGarmentFromUserInventory,
  getUserInventory,
  isFirebaseConfigured,
  loginUser,
  registerMerchant,
  saveMerchantProfile,
  updateGarmentInUserInventory,
} from '../services/firebase';

interface MerchantDashboardProps {
  inventory: Garment[];
  merchantProfile: MerchantProfile;
  onUpdateInventory: (newInventory: Garment[]) => void;
  onUpdateProfile: (newProfile: MerchantProfile) => void;
  onBack: () => void;
  onCustomerLogin: () => void;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  inventory,
  merchantProfile,
  onUpdateInventory,
  onUpdateProfile,
  onBack,
  onCustomerLogin,
}) => {
  // Refresh sonrasi App.tsx merchant detection ile dolu profil pass eder; bu durumda
  // login formunu gostermeden direkt dashboard'a girilsin diye prop'tan turetiyoruz.
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(merchantProfile.uid));

  useEffect(() => {
    if (merchantProfile.uid && !isLoggedIn) {
      setIsLoggedIn(true);
    }
  }, [merchantProfile.uid]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'inventory' | 'profile' | 'balance'>('inventory');
  const [itemEditorMode, setItemEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeQrItem, setActiveQrItem] = useState<Garment | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemShopUrl, setNewItemShopUrl] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileName, setProfileName] = useState(merchantProfile.name);
  const [profileLogo, setProfileLogo] = useState<string | null>(merchantProfile.logoUrl || null);
  const [profileDescription, setProfileDescription] = useState(merchantProfile.description || '');
  const [profileInstagram, setProfileInstagram] = useState(merchantProfile.instagramUrl || '');
  const [profileShopUrl, setProfileShopUrl] = useState(merchantProfile.defaultShopUrl || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(merchantProfile.whatsappNumber || '');
  const [profileCurrency, setProfileCurrency] = useState<Currency>(merchantProfile.currency || 'TRY');
  const [profileModelPreset, setProfileModelPreset] = useState<ModelPreset>(
    merchantProfile.modelPreset || 'balanced'
  );
  const logoInputRef = useRef<HTMLInputElement>(null);

  const syncProfileForm = (profile: MerchantProfile) => {
    setProfileName(profile.name);
    setProfileLogo(profile.logoUrl || null);
    setProfileDescription(profile.description || '');
    setProfileInstagram(profile.instagramUrl || '');
    setProfileShopUrl(profile.defaultShopUrl || '');
    setProfileWhatsapp(profile.whatsappNumber || '');
    setProfileCurrency(profile.currency || 'USD');
    setProfileModelPreset(profile.modelPreset || 'balanced');
  };

  const resetItemForm = () => {
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemShopUrl('');
    setNewItemImage(null);
    setEditingItemId(null);
    setItemEditorMode(null);
  };

  const openCreateItemForm = () => {
    resetItemForm();
    setItemEditorMode('create');
  };

  const openEditItemForm = (item: Garment) => {
    setNewItemName(item.name);
    setNewItemDesc(item.description);
    setNewItemPrice(String(item.price));
    setNewItemShopUrl(item.shopUrl || '');
    setNewItemImage(item.imageUrl);
    setEditingItemId(item.id);
    setItemEditorMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeItemEditor = () => {
    resetItemForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const { role, profile } = await loginUser(email, password);
      if (role !== 'merchant') {
        throw new Error('Bu alana sadece magaza sahipleri erisebilir.');
      }

      const merchant = profile as MerchantProfile;
      onUpdateProfile(merchant);
      syncProfileForm(merchant);

      if (merchant.uid) {
        const items = await getUserInventory(merchant.uid);
        onUpdateInventory(items);
        localStorage.setItem('mirrorly_inventory', JSON.stringify(items));
      }

      localStorage.setItem('mirrorly_profile', JSON.stringify(merchant));
      setIsLoggedIn(true);
    } catch (error: any) {
      let message = 'Giris yapilamadi.';
      if (error?.code === 'auth/invalid-credential') {
        message = 'E-posta veya sifre hatali.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const newProfile = await registerMerchant(email, password, storeName);
      onUpdateProfile(newProfile);
      syncProfileForm(newProfile);
      onUpdateInventory([]);
      localStorage.setItem('mirrorly_profile', JSON.stringify(newProfile));
      localStorage.setItem('mirrorly_inventory', JSON.stringify([]));
      setIsLoggedIn(true);
    } catch (error: any) {
      let message = 'Kayit olusturulamadi.';
      if (error?.code === 'auth/email-already-in-use') {
        message = 'Bu e-posta adresi zaten kullanimda.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'Sifre cok zayif. En az 6 karakter kullanin.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Gorsel boyutu cok buyuk. Lutfen 5MB altinda bir gorsel secin.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemImage) {
      alert('Lutfen urun gorseli ekleyin.');
      return;
    }

    if (!merchantProfile.uid) {
      alert('Magaza profili bulunamadi. Lutfen tekrar giris yapin.');
      return;
    }

    setIsSaving(true);

    try {
      const item: Garment = {
        id: editingItemId || crypto.randomUUID(),
        merchantUid: merchantProfile.uid,
        name: newItemName,
        description: newItemDesc || 'Exclusive Piece',
        imageUrl: newItemImage,
        price: parseFloat(newItemPrice) || 0,
        currency: merchantProfile.currency || 'TRY',
        boutiqueName: merchantProfile.name,
        shopUrl: newItemShopUrl.trim(),
      };

      let updatedInventory: Garment[];

      if (itemEditorMode === 'edit' && editingItemId) {
        await updateGarmentInUserInventory(merchantProfile.uid, item);
        updatedInventory = inventory.map((garment) => (garment.id === editingItemId ? item : garment));
      } else {
        const docId = await addGarmentToUserInventory(merchantProfile.uid, item);
        const createdItem = { ...item, id: docId };
        updatedInventory = [...inventory, createdItem];
      }

      onUpdateInventory(updatedInventory);
      localStorage.setItem('mirrorly_inventory', JSON.stringify(updatedInventory));
      closeItemEditor();
    } catch (error: any) {
      alert(error?.message || 'Urun kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantProfile.uid) {
      alert('Magaza profili bulunamadi.');
      return;
    }

    setIsSaving(true);

    const nextProfile: MerchantProfile = {
      ...merchantProfile,
      uid: merchantProfile.uid,
      role: 'merchant',
      name: profileName,
      logoUrl: profileLogo || undefined,
      description: profileDescription,
      instagramUrl: profileInstagram,
      defaultShopUrl: profileShopUrl,
      whatsappNumber: profileWhatsapp,
      currency: profileCurrency,
      modelPreset: profileModelPreset,
    };

    try {
      await saveMerchantProfile(nextProfile);
      onUpdateProfile(nextProfile);
      localStorage.setItem('mirrorly_profile', JSON.stringify(nextProfile));
    } catch (error: any) {
      alert(error?.message || 'Magaza bilgileri guncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: Garment) => {
    if (!merchantProfile.uid) return;

    const confirmed = window.confirm(`"${item.name}" urununu silmek istediginize emin misiniz?`);
    if (!confirmed) return;

    setDeletingItemId(item.id);
    try {
      await deleteGarmentFromUserInventory(merchantProfile.uid, item.id);
      const updatedInventory = inventory.filter((garment) => garment.id !== item.id);
      onUpdateInventory(updatedInventory);
      localStorage.setItem('mirrorly_inventory', JSON.stringify(updatedInventory));
    } catch (error: any) {
      alert(error?.message || 'Silme islemi basarisiz oldu.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const getProductDeepLink = (itemId: string) =>
    `${window.location.origin}${window.location.pathname}?id=${itemId}&m=${merchantProfile.uid}`;

  const generateQrImage = (itemId: string) => {
    const data = encodeURIComponent(getProductDeepLink(itemId));
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}&color=111827&bgcolor=fdfbf7`;
  };

  const handlePrint = () => window.print();

  if (!isLoggedIn) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-mirrorly-black text-white animate-fade-in px-8 overflow-y-auto">
        <img
          src="/brand/who-boutique.jpg"
          alt=""
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mirrorly-black via-mirrorly-black/85 to-mirrorly-black/70" />
        <div className="relative z-10 w-full max-w-xs space-y-6 py-8">
          <div className="text-center mb-4">
            <h2 className="font-serif text-3xl mb-2 text-boutique-gold">Boutique Access</h2>
            <p className="text-gray-400 text-sm font-sans">
              Urunlerini yukle, QR olustur ve deneme kredilerini yonet.
            </p>
          </div>

          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !isRegistering ? 'bg-boutique-gold text-mirrorly-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Giris Yap
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isRegistering ? 'bg-boutique-gold text-mirrorly-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Kayit Ol
            </button>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-200">{authError}</p>
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600"
                placeholder="magaza@email.com"
                required
              />
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600"
                placeholder="Magaza adi"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600"
                placeholder="En az 6 karakter"
                minLength={6}
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-boutique-gold text-mirrorly-black font-medium py-3 rounded-lg flex justify-center uppercase tracking-wide text-xs"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hesap Olustur'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600"
                placeholder="magaza@email.com"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600"
                placeholder="Sifre"
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-boutique-gold text-mirrorly-black font-medium py-3 rounded-lg flex justify-center uppercase tracking-wide text-xs"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Giris Yap'}
              </button>
            </form>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-700" />
            <span className="flex-shrink-0 mx-4 text-mirrorly-stone text-xs">veya</span>
            <div className="flex-grow border-t border-gray-700" />
          </div>

          <button
            onClick={onCustomerLogin}
            className="w-full bg-white text-mirrorly-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Musteri Girisine Gec
          </button>

          <button onClick={onBack} className="w-full text-xs text-mirrorly-stone hover:text-white mt-4">
            Aynaya Don
          </button>
        </div>
      </div>
    );
  }

  if (activeQrItem) {
    const qrTextPathId = `mirrorly-ring-${activeQrItem.id}`;

    return (
      <div className="h-full flex flex-col bg-white animate-fade-in relative z-50">
        <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-mirrorly-paper px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveQrItem(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-mirrorly-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Panele Don
            </button>

            <button
              onClick={() => setActiveQrItem(null)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 shadow-sm transition-all active:scale-95"
              title="Kapat"
            >
              <X className="w-5 h-5 text-mirrorly-black" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 overflow-y-auto">
          {/* QR Code Display */}
          <div className="print-area bg-white p-6 rounded-[32px] border border-mirrorly-paper flex flex-col items-center shadow-2xl max-w-sm">
            <div className="relative w-[320px] h-[320px] mb-5">
              <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
                <defs>
                  <path
                    id={qrTextPathId}
                    d="M 160,160 m -130,0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0"
                  />
                </defs>
                <circle cx="160" cy="160" r="140" fill="#fdfbf7" stroke="#d4af37" strokeWidth="1.5" />
                <text fill="#111827" fontSize="11" letterSpacing="3">
                  <textPath href={`#${qrTextPathId}`} startOffset="50%" textAnchor="middle">
                    MIRRORLY • TRY IT ON • MIRRORLY • TRY IT ON • MIRRORLY • TRY IT ON • MIRRORLY • TRY IT ON •
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-[58px] bg-white rounded-[28px] border border-mirrorly-paper flex items-center justify-center shadow-lg">
                <img
                  src={generateQrImage(activeQrItem.id)}
                  alt="QR Code"
                  className="w-[188px] h-[188px] mix-blend-multiply"
                />
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-2 bg-mirrorly-black text-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-boutique-gold" />
                Mirrorly
              </span>
              <h3 className="font-serif text-3xl text-mirrorly-black mt-3">{activeQrItem.name}</h3>
              <p className="text-sm text-mirrorly-stone mt-1">{merchantProfile.name}</p>
              <p className="text-xl font-medium mt-3 text-boutique-gold">{formatPrice(activeQrItem.price, merchantProfile.currency)}</p>
              <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-widest">
                QR kodu okutun, deneyin
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print w-full max-w-sm space-y-3">
            <button
              onClick={handlePrint}
              className="w-full bg-mirrorly-black text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-mirrorly-stone shadow-lg shadow-gray-200 transition-all"
            >
              <Printer className="w-4 h-4" />
              Etiketi Yazdır
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  const deepLink = getProductDeepLink(activeQrItem.id);
                  await navigator.clipboard.writeText(deepLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="bg-white text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2 border border-mirrorly-paper hover:bg-mirrorly-cream transition-colors text-sm"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Linki Kopyala</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const qrUrl = generateQrImage(activeQrItem.id);
                  const a = document.createElement('a');
                  a.href = qrUrl;
                  a.download = `mirrorly-${activeQrItem.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="bg-white text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2 border border-mirrorly-paper hover:bg-mirrorly-cream transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Resim İndir</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="no-print w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
            <h4 className="font-serif text-base text-mirrorly-black">QR Kodunu Nasıl Kullanırım?</h4>

            <div className="space-y-2 text-left text-sm text-gray-700">
              <div className="flex gap-3">
                <span className="text-lg font-bold text-amber-600 flex-shrink-0">1</span>
                <div>
                  <p className="font-medium">Etiket olarak yazdır</p>
                  <p className="text-xs text-gray-600">Yukarıdan "Etiketi Yazdır" butonunu tıkla, QR kodunu yazdır ve ürün etiketine yapıştır.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg font-bold text-amber-600 flex-shrink-0">2</span>
                <div>
                  <p className="font-medium">Online ürün sayfasında göster</p>
                  <p className="text-xs text-gray-600">QR kodunu indir ve web sitenizde / sosyal medya ürün görseline ekle. Müşteriler okuttuktan sonra sanal deneme yapabilir.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg font-bold text-amber-600 flex-shrink-0">3</span>
                <div>
                  <p className="font-medium">Sosyal medyada paylaş</p>
                  <p className="text-xs text-gray-600">Instagram, TikTok veya başka kanallarında bu ürünü paylaş. Takipçilerin QR ile deneyim yapmasını sağla.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg font-bold text-amber-600 flex-shrink-0">4</span>
                <div>
                  <p className="font-medium">Linki kendi tasarımında kullan</p>
                  <p className="text-xs text-gray-600">"Linki Kopyala" butonuyla bağlantıyı al, kendi tasarımın veya dökümanında kullan.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link Display */}
          <div className="no-print w-full max-w-sm text-center">
            <p className="text-[10px] text-gray-400 mb-2 font-medium">QR Bağlantısı:</p>
            <p className="text-[10px] text-mirrorly-stone font-mono break-all bg-mirrorly-cream p-3 rounded border border-mirrorly-paper max-h-16 overflow-y-auto">
              {getProductDeepLink(activeQrItem.id)}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setActiveQrItem(null)}
            className="w-full max-w-sm bg-white text-gray-600 py-3 rounded-lg font-medium border border-mirrorly-paper hover:bg-mirrorly-cream transition-colors no-print"
          >
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    {isLoggedIn && merchantProfile.status === 'pending' && (
      <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-8 text-center overflow-hidden bg-mirrorly-cream">
        <img
          src="/brand/owner.jpg"
          alt=""
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mirrorly-cream/85 via-mirrorly-cream/90 to-mirrorly-cream" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="font-serif text-2xl text-mirrorly-black mb-3">Başvurunuz İnceleniyor</h2>
          <p className="text-mirrorly-stone text-sm leading-relaxed max-w-xs mb-6">
            Mağazanız Mirrorly ekibi tarafından inceleniyor. Onay sonrası panele tam erişim sağlayacaksınız.
          </p>
          <p className="text-xs text-gray-400">
            Sorularınız için:{' '}
            <a href="https://wa.me/?text=Mirrorly%20mağaza%20başvurum%20hakkında%20bilgi%20almak%20istiyorum." className="underline text-gray-600">
              WhatsApp ile ulaşın
            </a>
          </p>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="mt-8 text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    )}
    {isLoggedIn && merchantProfile.status !== 'pending' && (
    <div className="flex flex-col min-h-[100dvh] bg-mirrorly-cream animate-fade-in">
      <div className="bg-white px-4 sm:px-8 md:px-12 pt-6 pb-2 border-b border-mirrorly-paper sticky top-0 z-10">
        {/* Mağaza kimliği ve çıkış */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {merchantProfile.logoUrl ? (
              <img
                src={merchantProfile.logoUrl}
                alt={merchantProfile.name}
                className="w-9 h-9 rounded-full object-cover border border-mirrorly-paper"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <Store className="w-4 h-4 text-mirrorly-stone" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Mağaza Paneli</p>
              <p className="font-serif text-lg leading-tight text-mirrorly-black">{merchantProfile.name}</p>
            </div>
          </div>

          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-mirrorly-stone hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-sans">Çıkış</span>
          </button>
        </div>

        <div className="flex gap-3">
          {[
            { key: 'inventory', label: 'Urunler', icon: Package },
            { key: 'balance', label: 'Krediler', icon: Coins },
            { key: 'profile', label: 'Magaza', icon: Store },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key ? 'text-mirrorly-black' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" /> {tab.label}
                </div>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mirrorly-gold" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 hide-scrollbar">
        <div className="max-w-4xl mx-auto">
        {/* Kredi Uyarı Banner */}
        {merchantProfile.credits === 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Coins className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">Krediniz tükendi</p>
              <p className="text-xs text-red-600 mt-0.5">
                Müşterileriniz deneme yapamıyor. Kredi eklemek için bizimle iletişime geçin.
              </p>
            </div>
          </div>
        )}

        {merchantProfile.credits > 0 && merchantProfile.credits <= 3 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Krediniz azalıyor ({merchantProfile.credits} kaldı)</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Yakında müşteri denemeleri durabilir. Kredi eklemek için bizimle iletişime geçin.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-sans font-medium text-mirrorly-black">Envanter Listesi</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Her urun icin benzersiz bir QR otomatik olusturulur. Kartlara dokunarak urun
                  detaylarini guncelleyebilirsin.
                </p>
              </div>
              <button
                onClick={() => (itemEditorMode ? closeItemEditor() : openCreateItemForm())}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  itemEditorMode ? 'bg-gray-200 text-gray-600 rotate-45' : 'bg-boutique-gold text-white'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {itemEditorMode && (
              <form
                onSubmit={handleSubmitItem}
                className="bg-white p-5 rounded-xl shadow-md mb-6 space-y-4 border border-mirrorly-paper relative"
              >
                {isSaving && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-boutique-gold animate-spin" />
                      <span className="text-xs mt-2 text-mirrorly-stone">Kaydediliyor...</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-mirrorly-black">
                      {itemEditorMode === 'edit' ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {itemEditorMode === 'edit'
                        ? 'Karttaki bilgileri guncelleyip yeniden kaydedebilirsin.'
                        : 'QR olusmadan once urun detaylarini tamamla.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeItemEditor}
                    className="text-xs text-mirrorly-stone hover:text-mirrorly-black"
                  >
                    Vazgec
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] bg-mirrorly-cream border-2 border-dashed border-mirrorly-gold/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
                >
                  {newItemImage ? (
                    <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400 font-medium uppercase">
                        Urun Gorseli Yukle
                      </span>
                      <p className="text-[11px] text-gray-400 mt-3 max-w-[220px] text-center leading-relaxed">
                        Duz arka plan, net kadraj ve urunun tek basina gorundugu fotoograflar en iyi
                        sonucu verir.
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setNewItemImage)}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Urun adi"
                  className="w-full bg-mirrorly-cream rounded-lg p-3 text-sm border border-mirrorly-paper focus:border-mirrorly-gold focus:outline-none transition-colors"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Kisa aciklama"
                  className="w-full bg-mirrorly-cream rounded-lg p-3 text-sm min-h-24 resize-none border border-mirrorly-paper focus:border-mirrorly-gold focus:outline-none transition-colors"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  className="w-full bg-mirrorly-cream rounded-lg p-3 text-sm border border-mirrorly-paper focus:border-mirrorly-gold focus:outline-none transition-colors"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  required
                />
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="Urun linki (opsiyonel)"
                    className="w-full bg-mirrorly-cream rounded-lg p-3 pl-9 text-sm border border-mirrorly-paper focus:border-mirrorly-gold focus:outline-none transition-colors"
                    value={newItemShopUrl}
                    onChange={(e) => setNewItemShopUrl(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-mirrorly-black text-white py-3 rounded-lg text-sm font-medium"
                >
                  {itemEditorMode === 'edit' ? 'Degisiklikleri Kaydet' : 'Envantere Ekle'}
                </button>
              </form>
            )}

            {!isFirebaseConfigured() && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-4">
                Bu akisin telefonla calisabilmesi icin Firebase yapilandirmasi aktif olmali.
              </div>
            )}

            <div className="space-y-3 pb-8">
              {inventory.length === 0 && (
                <p className="text-gray-400 text-center text-sm py-8">Henuz urun yok.</p>
              )}
              {inventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openEditItemForm(item)}
                  className={`bg-white p-3 rounded-xl shadow-sm border border-gray-50 flex items-center gap-4 ${
                    deletingItemId === item.id ? 'opacity-50' : ''
                  } cursor-pointer transition-all hover:border-mirrorly-paper hover:shadow-md`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-20 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-mirrorly-black truncate text-lg">{item.name}</h4>
                    <p className="text-xs text-gray-400 truncate mb-1">{item.description}</p>
                    <span className="text-sm font-bold text-mirrorly-black">{formatPrice(item.price, merchantProfile.currency)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveQrItem(item);
                      }}
                      className="p-2 bg-mirrorly-cream rounded-lg hover:bg-mirrorly-black hover:text-white text-gray-600 transition-colors"
                      title="QR Olustur"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditItemForm(item);
                      }}
                      className="p-2 bg-amber-50 rounded-lg hover:bg-amber-500 hover:text-white text-amber-500 transition-colors"
                      title="Urunu Duzenle"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      disabled={deletingItemId === item.id}
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white text-red-400 transition-colors disabled:opacity-50"
                      title="Urunu Sil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-mirrorly-paper shadow-sm text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans mb-2">Mevcut Kredi</p>
              <p className="font-serif text-5xl text-mirrorly-black mb-1">{merchantProfile.credits}</p>
              <p className="text-sm text-mirrorly-stone">kullanılabilir deneme kredisi</p>
            </div>

            <div className="p-4 bg-mirrorly-cream rounded-2xl border border-mirrorly-paper space-y-2">
              <p className="text-sm font-medium text-gray-700">Kredi nasıl çalışır?</p>
              <ul className="text-sm text-mirrorly-stone space-y-1 list-disc list-inside">
                <li>Ekonomik mod: 1 kredi / deneme</li>
                <li>Dengeli mod: 2 kredi / deneme</li>
                <li>Premium mod: 3 kredi / deneme</li>
              </ul>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-mirrorly-paper shadow-sm space-y-4">
              <div>
                <p className="text-sm font-medium text-mirrorly-black">Magaza Paketleri</p>
                <p className="text-sm text-mirrorly-stone mt-1">
                  QR trafigini finanse etmek icin daha yuksek kredi paketlerini buradan yonet.
                </p>
              </div>

              {billingNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {billingNotice}
                </div>
              )}

              <div className="space-y-3">
                {MERCHANT_CREDIT_PACKAGES.map((pack) => {
                  const checkoutReady = !!buildMerchantCheckoutUrl(pack, merchantProfile.uid);

                  return (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={!merchantProfile.uid}
                      onClick={() => {
                        setBillingNotice('');

                        if (!openMerchantCheckout(pack, merchantProfile.uid)) {
                          setBillingNotice(
                            'Bu paket icin LemonSqueezy checkout linki henuz tanimlanmadi. Vercel env degiskenlerini eklememiz gerekiyor.'
                          );
                        }
                      }}
                      className="w-full rounded-2xl border border-mirrorly-paper bg-white px-5 py-5 text-left shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-serif text-xl text-mirrorly-black">{pack.label}</p>
                          <p className="text-sm text-mirrorly-stone mt-1">{pack.description}</p>
                          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mt-3">
                            {pack.credits} kredi yukler
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="rounded-full bg-mirrorly-black px-4 py-2 text-sm font-medium text-white">
                            +{pack.credits}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="uppercase tracking-[0.22em] text-gray-400">
                          {pack.packType === 'starter'
                            ? 'Pilot'
                            : pack.packType === 'pro'
                              ? 'Buyume'
                              : 'Yuksek hacim'}
                        </span>
                        <span className={checkoutReady ? 'text-emerald-700' : 'text-amber-700'}>
                          {checkoutReady ? 'Lemon checkout hazir' : 'Checkout linki bekliyor'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

{activeTab === 'profile' && (
          <div className="space-y-6 relative pb-20 sm:pb-8">
            {isSaving && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-boutique-gold animate-spin" />
                  <span className="text-xs mt-2 text-mirrorly-stone">Guncelleniyor...</span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-boutique-gold transition-colors"
              >
                {profileLogo ? (
                  <img src={profileLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setProfileLogo)}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2">Magaza logosu</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 text-mirrorly-black"
                placeholder="Magaza adi"
              />

              <textarea
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 text-mirrorly-black min-h-24 resize-none"
                placeholder="Magaza aciklamasi"
              />

              <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={profileShopUrl}
                  onChange={(e) => setProfileShopUrl(e.target.value)}
                  placeholder="Varsayilan online satis linki"
                  className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 pl-9 text-mirrorly-black"
                />
              </div>

              <div className="relative">
                <MessageCircle className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileWhatsapp}
                  onChange={(e) => setProfileWhatsapp(e.target.value)}
                  placeholder="WhatsApp numarasi"
                  className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 pl-9 text-mirrorly-black"
                />
              </div>

              <div className="relative">
                <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={profileInstagram}
                  onChange={(e) => setProfileInstagram(e.target.value)}
                  placeholder="Instagram kullanici adi veya linki"
                  className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 pl-9 text-mirrorly-black"
                />
              </div>

              <div className="relative">
                <Coins className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <select
                  value={profileCurrency}
                  onChange={(e) => setProfileCurrency(e.target.value as Currency)}
                  className="w-full bg-white border border-mirrorly-paper rounded-lg p-3 pl-9 text-mirrorly-black appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-mirrorly-black text-white py-4 rounded-xl font-medium shadow-lg hover:bg-mirrorly-stone transition-colors"
              >
                Degisiklikleri Kaydet
              </button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
    )}
    </>
  );
};

export default MerchantDashboard;
