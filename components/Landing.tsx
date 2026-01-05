import React from 'react';
import { Scan, Sparkles } from 'lucide-react';

interface LandingProps {
  onMerchantLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onMerchantLogin }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-boutique-cream relative animate-fade-in px-6">
      
      {/* Decorative Mirror Element */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-boutique-gold/20 blur-2xl rounded-full"></div>
        <div className="relative w-48 h-64 border border-gray-200 rounded-[3rem] flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-xl">
           <Scan className="w-12 h-12 text-gray-400 opacity-50" />
        </div>
        <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-boutique-gold animate-bounce" />
      </div>

      <div className="text-center space-y-4 max-w-xs">
        <h2 className="font-serif text-3xl text-gray-900">The Mirror is Waiting</h2>
        <p className="font-sans text-gray-500 font-light leading-relaxed">
          To see the magic, please scan a QR code found on our boutique garments.
        </p>
      </div>

      {/* Discrete Merchant Entry */}
      <div className="absolute bottom-8 text-center w-full">
        <button 
          onClick={onMerchantLogin}
          className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-widest uppercase font-sans p-4"
        >
          Merchant Entrance
        </button>
      </div>
    </div>
  );
};

export default Landing;