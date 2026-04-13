import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Coins,
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
  Sparkles,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Garment, MerchantProfile, MODEL_PRESET_OPTIONS, ModelPreset } from '../types';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    `${window.location.origin}${window.location.pathname}?id=${itemId}`;

  const generateQrImage = (itemId: string) => {
    const data = encodeURIComponent(getProductDeepLink(itemId));
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}&color=111827&bgcolor=fdfbf7`;
  };

  const handlePrint = () => window.print();

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white animate-fade-in px-8 overflow-y-auto">
        <div className="w-full max-w-xs space-y-6 py-8">
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
                !isRegistering ? 'bg-boutique-gold text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              Giris Yap
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isRegistering ? 'bg-boutique-gold text-gray-900' : 'text-gray-400 hover:text-white'
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
                className="w-full bg-boutique-gold text-gray-900 font-medium py-3 rounded-lg flex justify-center uppercase tracking-wide text-xs"
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
                className="w-full bg-boutique-gold text-gray-900 font-medium py-3 rounded-lg flex justify-center uppercase tracking-wide text-xs"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Giris Yap'}
              </button>
            </form>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-700" />
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">veya</span>
            <div className="flex-grow border-t border-gray-700" />
          </div>

          <button
            onClick={onCustomerLogin}
            className="w-full bg-white text-gray-900 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Musteri Girisine Gec
          </button>

          <button onClick={onBack} className="w-full text-xs text-gray-500 hover:text-white mt-4">
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
        <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveQrItem(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Panele Don
            </button>

            <button
              onClick={() => setActiveQrItem(null)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 shadow-sm transition-all active:scale-95"
              title="Kapat"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 overflow-y-auto">
          <div className="print-area bg-white p-6 rounded-[32px] border border-gray-200 flex flex-col items-center shadow-2xl">
            <div className="relative w-[320px] h-[320px] mb-5">
              <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
                <defs>
                  <path
                    id={qrTextPathId}
                    d="M 160,160 m -130,0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0"
                  />
                </defs>
                <circle cx="160" cy="160" r="140" fill="#fdfbf7" stroke="#d4af37" strokeWidth="1.5" />
                <text fill="#111827" fontSize="11" letterSpacing="4">
                  <textPath href={`#${qrTextPathId}`} startOffset="50%" textAnchor="middle">
                    MIRRORLY • SCAN TO SEE IT ON YOU • AI TRY-ON EXPERIENCE •
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-[58px] bg-white rounded-[28px] border border-gray-200 flex items-center justify-center shadow-lg">
                <img
                  src={generateQrImage(activeQrItem.id)}
                  alt="QR Code"
                  className="w-[188px] h-[188px] mix-blend-multiply"
                />
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-boutique-gold" />
                Mirrorly
              </span>
              <h3 className="font-serif text-3xl text-gray-900 mt-3">{activeQrItem.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{merchantProfile.name}</p>
              <p className="text-xl font-medium mt-3 text-boutique-gold">${activeQrItem.price}</p>
            </div>
          </div>

          <div className="no-print w-full max-w-xs text-center">
            <p className="text-[10px] text-gray-400 font-mono break-all bg-gray-50 p-2 rounded border border-gray-100">
              {getProductDeepLink(activeQrItem.id)}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3 w-full max-w-xs no-print">
            <button
              onClick={handlePrint}
              className="w-full bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-black shadow-lg shadow-gray-200"
            >
              <Printer className="w-4 h-4" /> Etiketi Yazdir
            </button>

            <button
              onClick={() => setActiveQrItem(null)}
              className="w-full bg-white text-gray-500 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Panele Don
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 animate-fade-in">
      <div className="bg-white px-4 sm:px-8 md:px-12 pt-6 pb-2 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-900">
            <LogOut className="w-5 h-5" />
          </button>
          <span className="font-serif text-lg font-bold">{merchantProfile.name}</span>
          <div className="w-5" />
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
                  activeTab === tab.key ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" /> {tab.label}
                </div>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 hide-scrollbar">
        <div className="max-w-4xl mx-auto">
        {activeTab === 'inventory' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-sans font-medium text-gray-900">Envanter Listesi</h3>
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
                className="bg-white p-5 rounded-xl shadow-md mb-6 space-y-4 border border-gray-100 relative"
              >
                {isSaving && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-boutique-gold animate-spin" />
                      <span className="text-xs mt-2 text-gray-500">Kaydediliyor...</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
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
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Vazgec
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
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
                  className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Kisa aciklama"
                  className="w-full bg-gray-50 rounded-lg p-3 text-sm min-h-24 resize-none"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  className="w-full bg-gray-50 rounded-lg p-3 text-sm"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  required
                />
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="Urun linki (opsiyonel)"
                    className="w-full bg-gray-50 rounded-lg p-3 pl-9 text-sm"
                    value={newItemShopUrl}
                    onChange={(e) => setNewItemShopUrl(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium"
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
                  } cursor-pointer transition-all hover:border-gray-200 hover:shadow-md`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-20 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-gray-900 truncate text-lg">{item.name}</h4>
                    <p className="text-xs text-gray-400 truncate mb-1">{item.description}</p>
                    <span className="text-sm font-bold text-gray-900">${item.price}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveQrItem(item);
                      }}
                      className="p-2 bg-gray-50 rounded-lg hover:bg-gray-900 hover:text-white text-gray-600 transition-colors"
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
          <div className="space-y-6">
            <div
              className={`bg-white rounded-2xl p-6 shadow-sm border ${
                merchantProfile.credits < 3 ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Mevcut Deneme Kredisi
                  </p>
                  <div className="flex items-center gap-2">
                    <Coins
                      className={`w-8 h-8 ${
                        merchantProfile.credits < 3 ? 'text-red-400' : 'text-boutique-gold'
                      }`}
                    />
                    <span
                      className={`font-serif text-4xl font-bold ${
                        merchantProfile.credits < 3 ? 'text-red-500' : 'text-gray-900'
                      }`}
                    >
                      {merchantProfile.credits}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Her basarili denemede secili model kadar kredi dusurulur.</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Secili model: {MODEL_PRESET_OPTIONS.find((option) => option.value === merchantProfile.modelPreset)?.tool || 'Varsayilan model'} · {MODEL_PRESET_OPTIONS.find((option) => option.value === merchantProfile.modelPreset)?.creditCost || 1} kredi / deneme
                  </p>
                </div>
                {merchantProfile.credits < 3 && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-medium">
                    Kredi azaliyor
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-dashed border-gray-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-boutique-gold mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Kredi paketleri yakinda</h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    V1 fazinda sadece mevcut kredi bakiyesini takip ediyoruz. Paket satin alma ve
                    odeme akisi sonraki adimda eklenecek.
                  </p>
                </div>
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
                  <span className="text-xs mt-2 text-gray-500">Guncelleniyor...</span>
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
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900"
                placeholder="Magaza adi"
              />

              <textarea
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 min-h-24 resize-none"
                placeholder="Magaza aciklamasi"
              />

              <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={profileShopUrl}
                  onChange={(e) => setProfileShopUrl(e.target.value)}
                  placeholder="Varsayilan online satis linki"
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 pl-9 text-gray-900"
                />
              </div>

              <div className="relative">
                <MessageCircle className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileWhatsapp}
                  onChange={(e) => setProfileWhatsapp(e.target.value)}
                  placeholder="WhatsApp numarasi"
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 pl-9 text-gray-900"
                />
              </div>

              <div className="relative">
                <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={profileInstagram}
                  onChange={(e) => setProfileInstagram(e.target.value)}
                  placeholder="Instagram kullanici adi veya linki"
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 pl-9 text-gray-900"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-900">AI Model Profili</p>
                </div>

                <div className="space-y-3">
                  {MODEL_PRESET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileModelPreset(option.value)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        profileModelPreset === option.value
                          ? 'border-boutique-gold bg-boutique-gold/10'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                          <div className="mt-3 space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                              {option.tool}
                            </p>
                            <p className="text-xs text-gray-500">{option.cost}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-gray-400">
                          {option.badge}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-black transition-colors"
              >
                Degisiklikleri Kaydet
              </button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
