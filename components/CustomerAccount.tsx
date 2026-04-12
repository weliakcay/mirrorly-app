import React from 'react';
import { ArrowLeft, ChevronRight, Compass, Heart, History, LogOut, Sparkles } from 'lucide-react';
import { CustomerProfile } from '../types';

interface CustomerAccountProps {
  customerProfile: CustomerProfile;
  onBack: () => void;
  onOpenDiscover: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onLogout: () => Promise<void>;
}

const CustomerAccount: React.FC<CustomerAccountProps> = ({
  customerProfile,
  onBack,
  onOpenDiscover,
  onOpenFavorites,
  onOpenHistory,
  onLogout,
}) => {
  const initials = (customerProfile.displayName || customerProfile.email || 'M')
    .split(' ')
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-full flex flex-col bg-boutique-cream animate-fade-in">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <button
          onClick={onLogout}
          className="text-[11px] uppercase tracking-[0.24em] text-gray-400 hover:text-gray-700 transition-colors"
        >
          Cikis
        </button>
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-xl px-6 py-7">
          <div className="flex items-center gap-4">
            {customerProfile.photoURL ? (
              <img
                src={customerProfile.photoURL}
                alt={customerProfile.displayName || customerProfile.email}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-serif text-xl">
                {initials}
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 mb-1">
                Hesabim
              </p>
              <h2 className="font-serif text-2xl text-gray-900">
                {customerProfile.displayName || 'Mirrorly Member'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{customerProfile.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 space-y-4">
        <button
          onClick={onOpenHistory}
          className="w-full rounded-[1.75rem] bg-white/78 border border-white px-5 py-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <History className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-gray-900">Deneme Gecmisi</h3>
              <p className="text-sm text-gray-500">Kayitli son gorunumlerini gor</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={onOpenDiscover}
          className="w-full rounded-[1.75rem] bg-gray-900 text-white px-5 py-5 shadow-xl text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-boutique-gold" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45 mb-2">Kesfet</p>
              <h3 className="font-serif text-xl mb-2">Butikleri gezmeye basla</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Giris yapan kullanici artik QR disinda da urun gezebiliyor. Kesfet akisini ac.
              </p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onOpenFavorites}
            className="rounded-[1.5rem] bg-white/72 border border-white px-4 py-5 text-left"
          >
            <Heart className="w-5 h-5 text-gray-700 mb-3" />
            <p className="font-serif text-lg text-gray-900">Favoriler</p>
            <p className="text-xs text-gray-500 mt-1">Kaydettigin urunler</p>
          </button>

          <div className="rounded-[1.5rem] bg-white/72 border border-white px-4 py-5">
            <Sparkles className="w-5 h-5 text-gray-700 mb-3" />
            <p className="font-serif text-lg text-gray-900">Stil Varyasyonlari</p>
            <p className="text-xs text-gray-500 mt-1">Yakinda</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;
