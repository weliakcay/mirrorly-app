
import React from 'react';
import { ArrowRight, Chrome, History, Sparkles, Store } from 'lucide-react';
import { CustomerProfile } from '../types';
import Avatar from './Avatar';

interface LandingProps {
  onMerchantLogin: () => void;
  onOpenHistory: () => void;
  onCustomerLogin: () => void;
  isCustomerLoggedIn?: boolean;
  customerProfile?: CustomerProfile | null;
  onCustomerAccount?: () => void;
}

const Landing: React.FC<LandingProps> = ({
  onMerchantLogin,
  onOpenHistory,
  onCustomerLogin,
  isCustomerLoggedIn = false,
  customerProfile = null,
  onCustomerAccount,
}) => {
  return (
    <div className="h-full bg-boutique-cream animate-fade-in overflow-y-auto">
      {customerProfile && onCustomerAccount && (
        <div className="px-6 pt-4 pb-2 flex items-center justify-end">
          <button
            onClick={onCustomerAccount}
            className="rounded-full overflow-hidden hover:shadow-md transition-shadow"
            title="Hesabim"
          >
            <Avatar
              photoURL={customerProfile.photoURL}
              displayName={customerProfile.displayName}
              email={customerProfile.email}
              size={40}
            />
          </button>
        </div>
      )}
      <div className="min-h-full px-6 pt-8 pb-8 flex flex-col justify-between gap-8">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-boutique-gold/20 blur-2xl rounded-full"></div>
            <div className="relative mx-auto w-36 h-48 sm:w-48 sm:h-64 border border-mirrorly-paper rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl">
              <img
                src="/brand/who-customer.jpg"
                alt=""
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                className="w-full h-full object-cover"
              />
            </div>
            <Sparkles className="absolute -top-3 right-6 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 text-boutique-gold animate-bounce" />
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-mirrorly-gold text-[11px] uppercase tracking-[0.3em] font-semibold mb-3">Mirrorly</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-mirrorly-black">Mirrorly seni bekliyor</h2>
            <p className="font-sans text-sm sm:text-base text-mirrorly-stone font-light leading-relaxed max-w-xs mx-auto">
              QR ile geldikten sonra Google ile gir, kesfete gec ve deneme gecmisini hesabinda tut.
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-4">
          <button
            onClick={onCustomerLogin}
            className="w-full rounded-[2rem] bg-mirrorly-black text-white px-5 py-5 shadow-[0_20px_50px_rgba(17,24,39,0.2)] hover:bg-mirrorly-stone transition-all active:scale-[0.99] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.22),_transparent_38%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left min-w-0">
                <div className="w-14 h-14 rounded-[1.25rem] bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Chrome className="w-6 h-6 text-boutique-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-white/45 mb-1">
                    Musteri Alani
                  </p>
                  <h3 className="font-serif text-2xl leading-none">
                    {isCustomerLoggedIn ? 'Kesfete Don' : 'Google ile Gir'}
                  </h3>
                  <p className="text-sm text-white/70 mt-2">
                    {isCustomerLoggedIn
                      ? 'Favorilerini ve butikleri gezmeye kaldigin yerden devam et.'
                      : 'Favorilerini kaydet, butikleri gez ve denemelerini takip et.'}
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
            className="w-full flex items-center gap-3 px-5 py-4 bg-white border border-mirrorly-paper rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="p-2 bg-mirrorly-cream rounded-full group-hover:bg-gray-100 flex-shrink-0">
              <History className="w-5 h-5 text-gray-700" />
            </div>
            <div className="text-left min-w-0">
              <span className="block font-serif text-lg text-mirrorly-black leading-none">Deneme Gecmisi</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Son gorunumlerini ac</span>
            </div>
          </button>

          <div className="pt-2">
            <button
              onClick={onMerchantLogin}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/60 border border-mirrorly-paper rounded-2xl text-mirrorly-stone hover:text-gray-800 hover:bg-white hover:border-gray-300 transition-all text-sm font-sans"
            >
              <Store className="w-4 h-4" />
              Mağaza Girişi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
