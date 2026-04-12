import React, { useState } from 'react';
import { Garment, MerchantPublicProfile } from '../types';
import { ArrowLeft, ChevronRight, Grid3X3, Heart, Home, Sparkles, X } from 'lucide-react';

interface GarmentViewProps {
  garment: Garment;
  merchantProfile: MerchantPublicProfile;
  inventory: Garment[];
  isFavorited?: boolean;
  isCustomerLoggedIn?: boolean;
  onContinue: () => void;
  onCustomerAccess: () => void;
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
  onContinue,
  onCustomerAccess,
  onToggleFavorite,
  onSelectGarment,
  onBack,
  onHome,
}) => {
  const [showCollection, setShowCollection] = useState(false);
  const otherItems = inventory.filter((item) => item.id !== garment.id);

  return (
    <div className="h-full flex flex-col relative animate-fade-in bg-boutique-cream overflow-y-auto hide-scrollbar">
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
        <div className="pt-8 pb-4 px-6 text-center flex flex-col items-center flex-shrink-0">
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-gray-400 mb-3">
            Collection by
          </p>

          {merchantProfile.logoUrl ? (
            <img
              src={merchantProfile.logoUrl}
              alt={merchantProfile.name}
              className="h-12 object-contain mb-2"
            />
          ) : (
            <h2 className="font-serif text-2xl text-gray-900">{merchantProfile.name}</h2>
          )}

          {merchantProfile.description && (
            <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
              {merchantProfile.description}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pb-12">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 bg-white mb-8">
            <img src={garment.imageUrl} alt={garment.name} className="w-full h-full object-cover" />
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
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 pt-24 text-left">
              <h3 className="text-white font-serif text-3xl leading-tight mb-1">{garment.name}</h3>
              <p className="text-gray-200 font-sans text-sm font-light leading-relaxed opacity-90 mb-3 line-clamp-3">
                {garment.description}
              </p>
              <div className="inline-block px-3 py-1 border border-white/30 rounded-full backdrop-blur-sm bg-white/10">
                <p className="text-white font-sans font-medium text-sm">${garment.price}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3 pb-8">
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

            <p className="text-center text-xs text-gray-400 font-sans">
              QR ile aninda sanal deneme deneyimi
            </p>

            <button
              onClick={onCustomerAccess}
              className="w-full rounded-[1.5rem] border border-gray-200 bg-white px-4 py-4 text-left shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 mb-2">
                    Musteri Alani
                  </p>
                  <p className="font-serif text-lg text-gray-900">
                    {isCustomerLoggedIn ? 'Kesfete Gec' : 'Google ile Gir'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isCustomerLoggedIn
                      ? 'Butikleri gez, favorilerini kaydet ve uygulama icinde devam et.'
                      : 'Favorilerini kaydet ve QR disinda kesfette gezinmeye basla.'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-boutique-gold" />
                </div>
              </div>
            </button>

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
                    <p className="text-xs text-gray-500 font-medium">${item.price}</p>
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
