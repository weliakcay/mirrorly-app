
import React from 'react';
import { Scan, Sparkles, History } from 'lucide-react';

interface LandingProps {
  onMerchantLogin: () => void;
  onOpenHistory: () => void;
}

import { isFirebaseConfigured } from '../services/firebase';

const Landing: React.FC<LandingProps> = ({ onMerchantLogin, onOpenHistory }) => {
  const isConnected = isFirebaseConfigured();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-boutique-cream relative animate-fade-in px-6">

      {/* Decorative Mirror Element */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-boutique-gold/20 blur-2xl rounded-full"></div>
        <div className="relative w-48 h-64 border border-gray-200 rounded-[3rem] flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-xl">
          <Scan className="w-12 h-12 text-gray-400 opacity-50" />
        </div>
        <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-boutique-gold animate-bounce" />
      </div>

      <div className="text-center space-y-4 max-w-xs mb-12">
        <h2 className="font-serif text-3xl text-gray-900">The Mirror is Waiting</h2>
        <p className="font-sans text-gray-500 font-light leading-relaxed">
          To see the magic, please scan a QR code found on our boutique garments.
        </p>
      </div>

      {/* User History Button - Prominent */}
      <button
        onClick={onOpenHistory}
        className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
      >
        <div className="p-2 bg-gray-50 rounded-full group-hover:bg-gray-100">
          <History className="w-5 h-5 text-gray-700" />
        </div>
        <div className="text-left">
          <span className="block font-serif text-lg text-gray-900 leading-none">My Reflections</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">View Past Try-Ons</span>
        </div>
      </button>

      {/* Discrete Merchant Entry */}
      <div className="absolute bottom-8 text-center w-full space-y-2">
        <button
          onClick={onMerchantLogin}
          className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-widest uppercase font-sans p-4"
        >
          Merchant Entrance
        </button>

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-[10px] text-gray-300 font-mono">
            {isConnected ? 'System Online' : 'Local Mode (No DB)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
