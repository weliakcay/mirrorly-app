import React, { useState, useRef } from 'react';
import { QrCode, Plus, LogOut, Link as LinkIcon, Printer, X, Store, Package, Image as ImageIcon, Upload, Settings, Loader2, Trash2, CreditCard, Coins, Sparkles, Crown, Zap } from 'lucide-react';
import { Garment, MerchantProfile } from '../types';
import { addGarmentToDb, saveMerchantProfile, isFirebaseConfigured, deleteGarmentFromDb } from '../services/firebase';

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
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    // Tabs: 'inventory' | 'profile' | 'balance'
    const [activeTab, setActiveTab] = useState<'inventory' | 'profile' | 'balance'>('inventory');

    // Sub-states
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeQrItem, setActiveQrItem] = useState<Garment | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    // Delete state
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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
            credits: merchantProfile.credits // Preserve existing credits
        };

        try {
            if (isFirebaseConfigured()) {
                await saveMerchantProfile(newProfile);
            }

            onUpdateProfile(newProfile);

            // PERSISTENCE: Save to LocalStorage as fallback
            localStorage.setItem('mirrorly_profile', JSON.stringify(newProfile));

            alert("Mağaza bilgileri güncellendi!");
        } catch (error: any) {
            console.error("Profile Save Error:", error);
            alert(`Güncelleme hatası:\n${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Package Selection ---
    const handleSelectPackage = (packageName: string) => {
        setSelectedPackage(packageName);
        setShowPaymentModal(true);
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

    const handleDeleteItem = async (item: Garment) => {
        const confirmed = window.confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`);
        if (!confirmed) return;

        setDeletingItemId(item.id);
        try {
            if (isFirebaseConfigured()) {
                await deleteGarmentFromDb(item.id);
            }
            const updatedInventory = inventory.filter(g => g.id !== item.id);
            onUpdateInventory(updatedInventory);
            localStorage.setItem('mirrorly_inventory', JSON.stringify(updatedInventory));
        } catch (error: any) {
            console.error("Delete error:", error);
            alert(`Silme hatası: ${error.message}`);
        } finally {
            setDeletingItemId(null);
        }
    };

    // 1. Login Screen
    if (!isLoggedIn) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white animate-fade-in px-8 overflow-y-auto">
                <div className="w-full max-w-xs space-y-6 py-8">
                    <div className="text-center mb-4">
                        <h2 className="font-serif text-3xl mb-2 text-boutique-gold">Boutique Access</h2>
                        <p className="text-gray-400 text-sm font-sans">Envanterinizi ve satışlarınızı yönetin.</p>
                    </div>

                    {/* Login / Register Toggle */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setIsRegistering(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isRegistering ? 'bg-boutique-gold text-gray-900' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => setIsRegistering(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isRegistering ? 'bg-boutique-gold text-gray-900' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Kayıt Ol
                        </button>
                    </div>

                    {isRegistering ? (
                        // Registration Form
                        <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">E-posta</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                                    placeholder="ornek@mail.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">Mağaza Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                                    placeholder="Mağazanızın adı"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">Şifre</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                                    placeholder="En az 6 karakter"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-boutique-gold text-gray-900 font-medium py-3 rounded-lg hover:bg-white transition-colors mt-2">
                                Hesap Oluştur
                            </button>
                            <p className="text-[10px] text-gray-500 text-center">
                                Kayıt olarak Kullanım Şartlarını ve Gizlilik Politikasını kabul etmiş olursunuz.
                            </p>
                        </form>
                    ) : (
                        // Login Form
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-wider ml-1">E-posta veya Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-boutique-gold transition-colors"
                                    placeholder="ornek@mail.com"
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
                    )}

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

                    <button onClick={onBack} className="w-full text-xs text-gray-500 hover:text-white mt-4">Aynaya Dön</button>
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
                        <X className="w-6 h-6 text-gray-600" />
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
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'inventory' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" /> Ürünler
                        </div>
                        {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('balance')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'balance' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4" /> Bakiye
                        </div>
                        {activeTab === 'balance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-boutique-gold"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Store className="w-4 h-4" /> Mağaza
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
                                <div key={item.id} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-50 flex items-center gap-4 ${deletingItemId === item.id ? 'opacity-50' : ''}`}>
                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-20 rounded-lg object-cover bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-serif text-gray-900 truncate text-lg">{item.name}</h4>
                                        <p className="text-xs text-gray-400 truncate mb-1">{item.description}</p>
                                        <span className="text-sm font-bold text-gray-900">${item.price}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => setActiveQrItem(item)}
                                            className="p-2 bg-gray-50 rounded-lg hover:bg-gray-900 hover:text-white text-gray-600 transition-colors"
                                            title="QR Oluştur"
                                        >
                                            <QrCode className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item)}
                                            disabled={deletingItemId === item.id}
                                            className="p-2 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white text-red-400 transition-colors disabled:opacity-50"
                                            title="Ürünü Sil"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {/* === BALANCE TAB === */}
                {activeTab === 'balance' && (
                    <div className="space-y-6">
                        {/* Credit Display */}
                        <div className={`bg-white rounded-2xl p-6 shadow-sm border ${merchantProfile.credits < 20 ? 'border-red-200' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mevcut Bakiye</p>
                                    <div className="flex items-center gap-2">
                                        <Coins className={`w-8 h-8 ${merchantProfile.credits < 20 ? 'text-red-400' : 'text-boutique-gold'}`} />
                                        <span className={`font-serif text-4xl font-bold ${merchantProfile.credits < 20 ? 'text-red-500' : 'text-gray-900'}`}>
                                            {merchantProfile.credits}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Deneme Kredisi</p>
                                </div>
                                {merchantProfile.credits < 20 && (
                                    <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-medium">
                                        Kredi Azalıyor!
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="font-serif text-lg text-gray-900">Kredi Paketleri</h3>

                        {/* Pricing Packages */}
                        <div className="space-y-3">
                            {/* Starter */}
                            <div
                                onClick={() => handleSelectPackage('starter')}
                                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Starter</h4>
                                            <p className="text-xs text-gray-500">200 kredi • Küçük butikler için</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">$19<span className="text-xs font-normal text-gray-400">/ay</span></span>
                                </div>
                            </div>

                            {/* Growth - Popular */}
                            <div
                                onClick={() => handleSelectPackage('growth')}
                                className="bg-gradient-to-r from-boutique-gold/10 to-yellow-50 rounded-xl p-4 border-2 border-boutique-gold shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all relative"
                            >
                                <div className="absolute -top-2 right-4 bg-boutique-gold text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    En Popüler
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-boutique-gold/20 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-boutique-gold" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Growth</h4>
                                            <p className="text-xs text-gray-500">500 kredi • <span className="text-green-600 font-medium">%18 tasarruf</span></p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">$39<span className="text-xs font-normal text-gray-400">/ay</span></span>
                                </div>
                            </div>

                            {/* Pro */}
                            <div
                                onClick={() => handleSelectPackage('pro')}
                                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Crown className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Pro</h4>
                                            <p className="text-xs text-gray-500">1200 kredi • <span className="text-green-600 font-medium">%30 tasarruf</span></p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">$79<span className="text-xs font-normal text-gray-400">/ay</span></span>
                                </div>
                            </div>

                            {/* Enterprise */}
                            <div
                                onClick={() => handleSelectPackage('enterprise')}
                                className="bg-gray-900 rounded-xl p-4 shadow-sm cursor-pointer hover:bg-black hover:scale-[1.01] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">Enterprise</h4>
                                            <p className="text-xs text-gray-400">3000 kredi • <span className="text-green-400 font-medium">%47 tasarruf</span></p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-white">$149<span className="text-xs font-normal text-gray-400">/ay</span></span>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-400 text-center">
                            Her müşteri denemesinde 1 kredi kullanılır. Kredi bittiğinde müşteriler deneme yapamaz.
                        </p>
                    </div>
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
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-6">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-xl text-gray-900">Ödeme</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-boutique-gold/10 rounded-xl p-4 text-center">
                            <Coins className="w-12 h-12 text-boutique-gold mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                <span className="font-bold text-gray-900 capitalize">{selectedPackage}</span> paketi seçildi
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-gray-500 text-sm">
                                🚧 Ödeme sistemi yakında aktif olacak!
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Stripe/iyzico entegrasyonu üzerinde çalışıyoruz.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantDashboard;