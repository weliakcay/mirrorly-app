
import React from 'react';
import { ArrowRight, Chrome, History, Scan, Sparkles } from 'lucide-react';

interface LandingProps {
  onMerchantLogin: () => void;
  onOpenHistory: () => void;
  onCustomerLogin: () => void;
  isCustomerLoggedIn?: boolean;
}

const Landing: React.FC<LandingProps> = ({
  onMerchantLogin,
  onOpenHistory,
  onCustomerLogin,
  isCustomerLoggedIn = false,
}) => {
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

      <button
        onClick={onCustomerLogin}
        className="w-full max-w-sm rounded-[2rem] bg-gray-900 text-white px-5 py-5 shadow-[0_20px_50px_rgba(17,24,39,0.2)] hover:bg-black transition-all active:scale-[0.99] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.22),_transparent_38%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-[1.25rem] bg-white/10 border border-white/10 flex items-center justify-center">
              <Chrome className="w-6 h-6 text-boutique-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-white/45 mb-1">
                Musteri Alani
              </p>
              <h3 className="font-serif text-2xl leading-none">
                {isCustomerLoggedIn ? 'Kesfete Don' : 'Google ile Gir'}
              </h3>
              <p className="text-sm text-white/70 mt-2">
                {isCustomerLoggedIn
                  ? 'Favorilerini ve butikleri gezmeye devam et.'
                  : 'Kesfete gir, favorilerini kaydet ve denemelerini takip et.'}
              </p>
            </div>
          </div>

          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </button>

      <button
        onClick={onOpenHistory}
        className="mt-4 flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
      >
        <div className="p-2 bg-gray-50 rounded-full group-hover:bg-gray-100">
          <History className="w-5 h-5 text-gray-700" />
        </div>
        <div className="text-left">
          <span className="block font-serif text-lg text-gray-900 leading-none">Deneme Gecmisi</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Son gorunumlerini ac</span>
        </div>
      </button>

      {/* Discrete Merchant Entry */}
      <div className="mt-8 text-center">
        <button
          onClick={onMerchantLogin}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase font-sans p-4"
        >
          Magaza Girisi
        </button>
      </div>
    </div>
  );
};

export default Landing;
