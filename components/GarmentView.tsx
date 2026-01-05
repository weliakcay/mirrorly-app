import React from 'react';
import { Garment, MerchantProfile } from '../types';
import { ChevronRight, ShoppingBag } from 'lucide-react';

interface GarmentViewProps {
  garment: Garment;
  merchantProfile: MerchantProfile;
  onContinue: () => void;
  onMerchantClick: () => void;
}

const GarmentView: React.FC<GarmentViewProps> = ({ garment, merchantProfile, onContinue, onMerchantClick }) => {
  return (
    <div className="h-full flex flex-col relative animate-fade-in bg-boutique-cream">
      {/* Header / Boutique Identity */}
      <div className="pt-8 pb-4 px-6 text-center flex flex-col items-center">
        <p className="text-xs font-sans tracking-[0.2em] uppercase text-gray-500 mb-3">Welcome to</p>
        
        {merchantProfile.logoUrl ? (
          <img 
            src={merchantProfile.logoUrl} 
            alt={merchantProfile.name} 
            className="h-12 object-contain mb-1"
          />
        ) : (
          <h2 className="font-serif text-3xl text-gray-900">{merchantProfile.name}</h2>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        {/* Garment Card */}
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 bg-white">
          <img 
            src={garment.imageUrl} 
            alt={garment.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20">
            <h3 className="text-white font-serif text-2xl mb-1">{garment.name}</h3>
            <p className="text-white/80 font-sans text-sm font-light">{garment.description}</p>
            <p className="text-white font-sans font-medium mt-2">${garment.price}</p>
          </div>
        </div>

        {/* Invitation */}
        <div className="text-center space-y-6">
          <p className="font-serif text-xl italic text-gray-700">
            "This piece might suit you.<br/>Want to see?"
          </p>

          <button 
            onClick={onContinue}
            className="group relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white shadow-lg hover:scale-105 transition-all duration-300"
            aria-label="Try on"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Subtle Merchant Link */}
      <div className="pb-6 pt-4 text-center">
        <button 
          onClick={onMerchantClick}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors tracking-wide uppercase font-sans"
        >
          Bring Mirrorly to your boutique
        </button>
      </div>
    </div>
  );
};

export default GarmentView;