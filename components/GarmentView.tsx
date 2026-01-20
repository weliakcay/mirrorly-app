import React, { useState } from 'react';
import { Garment, MerchantProfile } from '../types';
import { Sparkles, ShoppingBag, Grid3X3, X, ArrowLeft } from 'lucide-react';

interface GarmentViewProps {
  garment: Garment;
  merchantProfile: MerchantProfile;
  inventory: Garment[];
  onContinue: () => void;
  onMerchantClick: () => void;
  onSelectGarment: (garment: Garment) => void;
  onBack: () => void;
}

const GarmentView: React.FC<GarmentViewProps> = ({
  garment,
  merchantProfile,
  inventory,
  onContinue,
  onMerchantClick,
  onSelectGarment,
  onBack
}) => {
  const [showCollection, setShowCollection] = useState(false);

  // Filter other items from the same boutique (excluding current garment)
  const otherItems = inventory.filter(item => item.id !== garment.id);

  const handleSelectOther = (item: Garment) => {
    onSelectGarment(item);
    setShowCollection(false);
  };

  return (
    // Added 'overflow-y-auto' and 'hide-scrollbar' to enable scrolling on mobile
    <div className="h-full flex flex-col relative animate-fade-in bg-boutique-cream overflow-y-auto hide-scrollbar">

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Content Wrapper to ensure min-height */}
      <div className="min-h-full flex flex-col">

        {/* Header / Boutique Identity */}
        <div className="pt-8 pb-4 px-6 text-center flex flex-col items-center flex-shrink-0">
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-gray-400 mb-3">Collection by</p>

          {merchantProfile.logoUrl ? (
            <img
              src={merchantProfile.logoUrl}
              alt={merchantProfile.name}
              className="h-10 object-contain mb-1"
            />
          ) : (
            <h2 className="font-serif text-2xl text-gray-900">{merchantProfile.name}</h2>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-6 pb-12">

          {/* Garment Card */}
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 bg-white mb-8">
            <img
              src={garment.imageUrl}
              alt={garment.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-24 text-left">
              <h3 className="text-white font-serif text-3xl leading-tight mb-1">{garment.name}</h3>
              <p className="text-gray-200 font-sans text-sm font-light leading-relaxed opacity-90 mb-3 line-clamp-2">{garment.description}</p>
              <div className="inline-block px-3 py-1 border border-white/30 rounded-full backdrop-blur-sm bg-white/10">
                <p className="text-white font-sans font-medium text-sm">${garment.price}</p>
              </div>
            </div>
          </div>

          {/* Advertising-Style CTA Button */}
          <div className="w-full max-w-sm space-y-3 pb-8">
            <button
              onClick={onContinue}
              className="group w-full relative bg-gray-900 text-white py-5 rounded-xl shadow-xl hover:bg-black hover:scale-[1.02] transition-all duration-300 active:scale-95"
            >
              <div className="absolute inset-0 rounded-xl border border-white/10"></div>
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-boutique-gold animate-pulse" />
                <span className="font-serif text-lg tracking-widest uppercase font-semibold">
                  See Yourself In This
                </span>
              </div>
            </button>

            <p className="text-center text-xs text-gray-400 font-sans">
              Instant AI Virtual Try-On • No Account Needed
            </p>

            {/* Browse Collection Button */}
            {otherItems.length > 0 && (
              <button
                onClick={() => setShowCollection(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-xs font-sans uppercase tracking-wider">
                  Browse Our Collection
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Footer / Merchant Link */}
        <div className="pb-8 text-center flex-shrink-0">
          <button
            onClick={onMerchantClick}
            className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-widest uppercase font-sans border-b border-transparent hover:border-gray-300"
          >
            Owner Access
          </button>
        </div>

      </div>

      {/* Collection Modal */}
      {showCollection && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-gray-900">Our Collection</h3>
              <button
                onClick={() => setShowCollection(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-2 gap-4">
              {otherItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectOther(item)}
                  className="text-left bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
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