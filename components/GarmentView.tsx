import React, { useState } from 'react';
import { Garment, MerchantPublicProfile } from '../types';
import { ArrowLeft, ChevronRight, Grid3X3, Heart, Home, Sparkles, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';

interface GarmentViewProps {
  garment: Garment;
  merchantProfile: MerchantPublicProfile;
  inventory: Garment[];
  isFavorited?: boolean;
  isCustomerLoggedIn?: boolean;
  customerCredits?: number;
  onContinue: () => void;
  onCustomerAccess: () => void;
  onOpenCredits: () => void;
  onToggleFavorite?: () => void;
  onSelectGarment: (garment: Garment) => void;
  onBack: () => void;
  onHome: () => void;
}

const GarmentView: React.FC<GarmentViewProps> = ({
  garment,
  merchantProfile,
  inventory,
  isFavorited = false,
  isCustomerLoggedIn = false,
  customerCredits = 0,
  onContinue,
  onCustomerAccess,
  onOpenCredits,
  onToggleFavorite,
  onSelectGarment,
  onBack,
  onHome,
}) => {
  const [showCollection, setShowCollection] = useState(false);
  const [imageError, setImageError] = useState(false);
  const otherItems = inventory.filter((item) => item.id !== garment.id);

  return (
    <div className="h-full min-h-0 flex flex-col relative animate-fade-in bg-boutique-cream overflow-y-auto hide-scrollbar">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <button
          onClick={onHome}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Home className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="min-h-full flex flex-col">
        {/* Hero Image Section */}
        <div className="relative w-full h-[65vh] flex-shrink-0 bg-gray-100">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-2 p-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                  <span className="text-gray-400 text-xl">📷</span>
                </div>
                <p className="text-xs text-gray-400">Ürün görseli yüklenemedi</p>
              </div>
            </div>
          ) : (
            <img
              src={garment.imageUrl}
              alt={garment.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/80 shadow-sm">
            <span className="text-[10px] tracking-[0.24em] uppercase text-gray-600">
              {merchantProfile.name}
            </span>
          </div>
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/88 backdrop-blur-md shadow-sm flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`}
              />
            </button>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 pt-12 text-left">
            <h3 className="text-white font-serif text-2xl leading-tight">{garment.name}</h3>
          </div>
        </div>

        {/* Action and Info Section */}
        <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-8">
          <div className="w-full max-w-sm space-y-4">
            {/* Primary CTA */}
            <button
              onClick={onContinue}
              className="group w-full relative bg-gray-900 text-white py-5 rounded-xl shadow-xl hover:bg-black hover:scale-[1.02] transition-all duration-300 active:scale-95"
            >
              <div className="absolute inset-0 rounded-xl border border-white/10" />
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-boutique-gold animate-pulse" />
                <span className="font-serif text-lg tracking-[0.18em] uppercase font-semibold">
                  Uzerinde Gor
                </span>
              </div>
            </button>

            {/* Boutique Info Card */}
            <div className="rounded-2xl border border-gray-200 bg-white/92 px-4 py-5 shadow-sm">
              <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-gray-400 mb-2">
                Collection by
              </p>
              {merchantProfile.logoUrl ? (
                <img
                  src={merchantProfile.logoUrl}
                  alt={merchantProfile.name}
                  className="h-10 object-contain mb-2"
                />
              ) : (
                <h2 className="font-serif text-xl text-gray-900 mb-2">{merchantProfile.name}</h2>
              )}
              {merchantProfile.description && (
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {merchantProfile.description}
                </p>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <p className="text-gray-200 font-sans text-sm font-light leading-relaxed text-gray-600">
                {garment.description}
              </p>
              <div className="inline-block px-3 py-1 border border-gray-200 rounded-full bg-gray-50">
                <p className="font-sans font-medium text-sm text-gray-900">{formatPrice(garment.price, garment.currency || merchantProfile.currency)}</p>
              </div>
            </div>

            {/* Customer Access */}
            <button
              onClick={onCustomerAccess}
              className="w-full rounded-2xl border border-gray-200 bg-white/92 px-4 py-4 text-left shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 mb-1">
                    Musteri Girisi
                  </p>
                  <p className="font-serif text-lg text-gray-900">
                    {isCustomerLoggedIn ? 'Kesfete Gec' : 'Google ile Gir'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isCustomerLoggedIn
                      ? 'Butikleri gez ve favorilerini tek alandan yonet.'
                      : 'Favorilerini kaydetmek ve kesfette dolasmak icin hesabini ac.'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-boutique-gold" />
                </div>
              </div>
            </button>

            {/* Credits Block */}
            {isCustomerLoggedIn && (
              <button
                onClick={onOpenCredits}
                className={`w-full rounded-[1.35rem] px-4 py-4 text-left border transition-all ${
                  customerCredits > 0
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-60 mb-1">
                  Kredi Durumu
                </p>
                <p className="font-serif text-lg">
                  {customerCredits > 0
                    ? `${customerCredits} kredi kullanima hazir`
                    : 'Denemeye devam etmek icin kredi yukle'}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  {customerCredits > 0
                    ? 'Giris yaptiktan sonraki try-on denemeleri bu bakiyeden duser.'
                    : 'Google hesabin icin bakiye yukleyip try-on akisini acabilirsin.'}
                </p>
              </button>
            )}

            {/* Other Items */}
            {otherItems.length > 0 && (
              <button
                onClick={() => setShowCollection(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-xs font-sans uppercase tracking-wider">
                  Diger Urunleri Gor
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      {showCollection && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl text-gray-900">Magaza Seckisi</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mt-1">
                  {merchantProfile.name}
                </p>
              </div>
              <button
                onClick={() => setShowCollection(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {otherItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectGarment(item);
                    setShowCollection(false);
                  }}
                  className="text-left bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-3">
                    <h4 className="font-serif text-sm text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500 font-medium">{formatPrice(item.price, item.currency || merchantProfile.currency)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GarmentView;
