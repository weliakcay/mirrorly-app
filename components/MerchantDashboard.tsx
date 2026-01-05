import React, { useState, useRef } from 'react';
import { QrCode, Plus, LogOut, Link as LinkIcon, Printer, X, Store, Package, Image as ImageIcon, Upload, Settings, Loader2, Key } from 'lucide-react';
import { Garment, MerchantProfile } from '../types';
import { addGarmentToDb, saveMerchantProfile, isFirebaseConfigured } from '../services/firebase';

interface MerchantDashboardProps {
  inventory: Garment[];
  merchantProfile: MerchantProfile;
  onUpdateInventory: (newInventory: Garment[]) => void;
  onUpdateProfile: (newProfile: MerchantProfile) => void;
  onBack: () => void;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ 
  inventory, 
  merchantProfile, 
  onUpdateInventory, 
  onUpdateProfile, 
  onBack 
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Tabs: 'inventory' | 'profile'
  const [activeTab, setActiveTab] = useState<'inventory' | 'profile'>('inventory');

  // Sub-states
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeQrItem, setActiveQrItem] = useState<Garment | null>(null);

  // Add Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemShopUrl, setNewItemShopUrl] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(merchantProfile.name);
  const [profileLink, setProfileLink] = useState(merchantProfile.paymentLink || '');
  const [profileApiKey, setProfileApiKey] = useState(merchantProfile.geminiApiKey || '');
  const [profileLogo, setProfileLogo] = useState<string | null>(merchantProfile.logoUrl || null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setIsLoggedIn(true);
    } else {
      // Allow easy access for demo if fields are empty, or enforce check
      // For UX: Just let them in if they click login for demo purposes
      if (username === '' && password === '') {
         setIsLoggedIn(true);
      } else {
         setIsLoggedIn(true);
      }
    }
  };

  const handleGoogleLogin = () => {
    setIsLoggedIn(true);
  };

  // --- Image Helpers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // 5MB Limit Check
      if (file.size > 5 * 1024 * 1024) {
          alert("Görsel boyutu çok büyük! Lütfen 5MB'dan küçük bir görsel seçin.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Inventory Logic ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemImage) {
        alert("Lütfen ürün görseli yükleyiniz.");
        return;
    }
    
    setIsSaving(true);

    try {
        const tempId = Math.random().toString(36).substr(2, 9);
        const safeShopUrl = newItemShopUrl || merchantProfile.paymentLink || "";

        const newItem: Garment = {
            id: tempId,
            name: newItemName,
            description: newItemDesc || 'Exclusive Piece',
            imageUrl: newItemImage, // Contains Base64
            price: parseFloat(newItemPrice) || 0,
            boutiqueName: merchantProfile.name,
            shopUrl: safeShopUrl
        };

        if (isFirebaseConfigured()) {
            const docId = await addGarmentToDb(newItem);
            newItem.id = docId; 
        }

        const updatedInventory = [...inventory, newItem];
        onUpdateInventory(updatedInventory);
        
        // PERSISTENCE: Save to LocalStorage as fallback
        localStorage.setItem('mirrorly_inventory', JSON.stringify(updatedInventory));

        setIsAdding(false);
        
        // Reset Form
        setNewItemName('');
        setNewItemDesc('');
        setNewItemPrice('');
        setNewItemShopUrl('');
        setNewItemImage(null);
        alert("Ürün başarıyla eklendi!");

    } catch (error: any) {
        console.error("Dashboard Error Detail:", error);
        alert(`Hata: ${error.message || "Kaydedilemedi"}`);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Profile Logic ---
  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      const newProfile: MerchantProfile = {
          name: profileName,
          logoUrl: profileLogo || undefined,
          paymentLink: profileLink,
          geminiApiKey: profileApiKey
      };

      try {
        if (isFirebaseConfigured()) {
            await saveMerchantProfile(newProfile);
        }
        
        onUpdateProfile(newProfile);
        
        // PERSISTENCE: Save to LocalStorage as fallback so API Key survives refresh
        localStorage.setItem('mirrorly_profile', JSON.stringify(newProfile));

        alert("Mağaza bilgileri güncellendi!");
      } catch (error: any) {
        console.error("Profile Save Error:", error);
        alert(`Güncelleme hatası:\n${error.message}`);
      } finally {
        setIsSaving(false);
      }
  };

  const getProductDeepLink = (itemId: string) => {
     return `${window.location.origin}${window.location.pathname}?id=${itemId}`;
  };

  const generateQrImage = (itemId: string) => {
    const data = encodeURIComponent(getProductDeepLink(itemId));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&color=1f2937&bgcolor=fdfbf7`;
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. Login Screen
  if (!isLoggedIn) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white animate-fade-in px-8">
            <div className="w-full max-w-xs space-y-6">
                <div className="text-center mb-8">
                    <h2 className="font-serif text-3xl mb-2 text-boutique-gold">Boutique Access</h2>
                    <p className="text-gray-400 text-sm font-sans">Envanterinizi ve satışlarınızı yönetin.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">Kullanıcı Adı</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                            placeholder="admin"
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">Şifre</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                            placeholder="••••"
                        />
                    </div>

                    <button type="submit" className="w-full bg-boutique-gold text-gray-900 font-medium py-3 rounded-lg hover:bg-white transition-colors mt-2">
                        Giriş Yap
                    </button>
                </form>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">veya</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-900 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
                >
                    <span className="font-bold text-lg text-blue-500">G</span>
                    Google ile Devam Et
                </button>

                <button onClick={onBack} className="w-full text-xs text-gray-500 hover:text-white mt-8">Aynaya Dön</button>
            </div>
        </div>
    );
  }

  // 2. QR Code Modal (Same as before)
  if (activeQrItem) {
      return (
          <div className="h-full flex flex-col bg-white animate-fade-in relative z-50">
              <div className="absolute top-4 right-4 no-print">
                  <button onClick={() => setActiveQrItem(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                      <X className="w-6 h-6 text-gray-600"/>
                  </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                  {/* Print Area Wrapper */}
                  <div className="print-area bg-white p-6 rounded-xl border-4 border-gray-900 flex flex-col items-center">
                    <img src={generateQrImage(activeQrItem.id)} alt="QR Code" className="w-64 h-64 mix-blend-multiply" />
                    <div className="mt-4 text-center">
                        <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full">{merchantProfile.name}</span>
                        <h3 className="font-serif text-3xl text-gray-900 mt-2">{activeQrItem.name}</h3>
                        <p className="text-xl font-medium mt-1 text-boutique-gold">${activeQrItem.price}</p>
                    </div>
                  </div>
                  
                  {/* Link Verification (Visible on screen, hidden in print) */}
                  <div className="no-print w-full max-w-xs text-center">
                      <p className="text-[10px] text-gray-400 font-mono break-all bg-gray-50 p-2 rounded border border-gray-100">
                          {getProductDeepLink(activeQrItem.id)}
                      </p>
                  </div>

                  <div className="pt-4 flex gap-4 w-full max-w-xs no-print">
                      <button 
                        onClick={handlePrint}
                        className="flex-1 bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-black"
                      >
                          <Printer className="w-4 h-4" /> Etiketi Yazdır
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  // 3. Main Dashboard
  return (
    <div className="h-full flex flex-col bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-2 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
            </button>
            <span className="font-serif text-lg font-bold">{merchantProfile.name}</span>
            <div className="w-5"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'inventory' ? 'text-gray-900' : 'text-gray-400'}`}
            >
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" /> Ürünler
                </div>
                {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'}`}
            >
                <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" /> Mağaza Bilgileri
                </div>
                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 py-6 overflow-auto hide-scrollbar">
        
        {/* === INVENTORY TAB === */}
        {activeTab === 'inventory' && (
            <>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sans font-medium text-gray-900">Envanter Listesi</h3>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdding ? 'bg-gray-200 text-gray-600 rotate-45' : 'bg-boutique-gold text-white hover:shadow-lg'}`}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAddItem} className="bg-white p-5 rounded-xl shadow-md mb-6 space-y-4 border border-gray-100 relative">
                        {isSaving && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-boutique-gold animate-spin" />
                                    <span className="text-xs mt-2 text-gray-500">Kaydediliyor...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Image Upload Area */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
                        >
                            {newItemImage ? (
                                <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                    <span className="text-xs text-gray-400 font-medium uppercase">Görsel Yükle</span>
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
                            placeholder="Ürün Adı" 
                            className="w-full bg-gray-50 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Kısa Açıklama" 
                            className="w-full bg-gray-50 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                        />
                        <div className="flex gap-3">
                             <input 
                                type="number" 
                                placeholder="Fiyat ($)" 
                                className="w-full bg-gray-50 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input 
                                type="url" 
                                placeholder="Satış Linki (Boş ise mağaza linki kullanılır)" 
                                className="w-full bg-gray-50 rounded-lg p-3 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                                value={newItemShopUrl}
                                onChange={(e) => setNewItemShopUrl(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium">Envantere Ekle</button>
                    </form>
                )}

                <div className="space-y-3 pb-8">
                    {!isFirebaseConfigured() && (
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-4">
                            <strong>Bilgi:</strong> Veritabanı bağlı değil. Verileriniz tarayıcınızda (Local) saklanıyor. Tarayıcı önbelleğini temizlerseniz veriler silinir.
                        </div>
                    )}

                    {inventory.length === 0 && <p className="text-gray-400 text-center text-sm py-8">Henüz ürün yok.</p>}
                    {inventory.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50 flex items-center gap-4">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-20 rounded-lg object-cover bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif text-gray-900 truncate text-lg">{item.name}</h4>
                                <p className="text-xs text-gray-400 truncate mb-1">{item.description}</p>
                                <span className="text-sm font-bold text-gray-900">${item.price}</span>
                            </div>
                            <button 
                                onClick={() => setActiveQrItem(item)}
                                className="p-3 bg-gray-50 rounded-xl hover:bg-gray-900 hover:text-white text-gray-600 transition-colors"
                                title="QR Oluştur"
                            >
                                <QrCode className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
            <div className="space-y-6 relative">
                 {isSaving && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                         <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-boutique-gold animate-spin" />
                             <span className="text-xs mt-2 text-gray-500">Güncelleniyor...</span>
                         </div>
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-boutique-gold transition-colors relative"
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
                    <span className="text-xs text-gray-400 mt-2">Mağaza Logosu Yükle</span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase font-bold ml-1">Mağaza Adı</label>
                        <input 
                            type="text" 
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-gray-900"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase font-bold ml-1 text-boutique-gold">Google Gemini API Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input 
                                type="password" 
                                value={profileApiKey}
                                onChange={(e) => setProfileApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 pl-9 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-boutique-gold"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 ml-1">
                            Sanal deneme (Virtual Try-On) için gereklidir. 
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-gray-900">Buradan alabilirsiniz.</a>
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase font-bold ml-1">Ödeme / Mağaza Linki</label>
                        <div className="relative">
                            <Settings className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input 
                                type="url" 
                                value={profileLink}
                                onChange={(e) => setProfileLink(e.target.value)}
                                placeholder="https://shopify.com/..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 pl-9 text-gray-900 focus:outline-none focus:border-gray-900"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 ml-1">Satın al butonuna tıklandığında gidilecek varsayılan adres.</p>
                    </div>

                    <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-black transition-colors">
                        Değişiklikleri Kaydet
                    </button>
                </form>

                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                    <p className="text-xs text-yellow-800 leading-relaxed">
                        <strong>İpucu:</strong> API anahtarını girdikten sonra uygulamanın ana sayfasına dönerek sanal deneme özelliğini test edebilirsiniz.
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;