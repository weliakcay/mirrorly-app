import React from 'react';
import { ArrowLeft, ChevronRight, Coins, Compass, Heart, History, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerProfile } from '../types';
import Avatar from './Avatar';

interface CustomerAccountProps {
  customerProfile: CustomerProfile;
  onBack: () => void;
  onOpenDiscover: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onOpenCredits: () => void;
  onLogout: () => Promise<void>;
}

const CustomerAccount: React.FC<CustomerAccountProps> = ({
  customerProfile,
  onBack,
  onOpenDiscover,
  onOpenFavorites,
  onOpenHistory,
  onOpenCredits,
  onLogout,
}) => {
  const { t } = useTranslation();
  const greetingName = customerProfile.displayName?.split(' ')[0] || customerProfile.email?.split('@')[0];

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-mirrorly-black" />
        </button>

        <button
          onClick={onLogout}
          className="text-[11px] uppercase tracking-[0.24em] text-gray-400 hover:text-gray-700 transition-colors"
        >
          {t('Cikis')}
        </button>
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-xl px-6 py-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar
                photoURL={customerProfile.photoURL}
                displayName={customerProfile.displayName}
                email={customerProfile.email}
                size={64}
                shape="rounded"
              />

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 mb-1">
                  {greetingName ? t('Merhaba {{name}}', { name: greetingName }) : t('Hesabim')}
                </p>
                <h2 className="font-serif text-2xl text-mirrorly-black">
                  {customerProfile.displayName || 'Mirrorly Member'}
                </h2>
                <p className="text-sm text-mirrorly-stone mt-1 truncate">{customerProfile.email}</p>
              </div>
            </div>

            <button
              onClick={onOpenCredits}
              className="rounded-[1.25rem] bg-mirrorly-black text-white px-4 py-3 text-left shadow-lg flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-boutique-gold" />
                <span className="font-medium">{customerProfile.credits}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45 mt-2">
                {t('Kredi Yukle')}
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 space-y-4">
        <button
          onClick={onOpenCredits}
          className="w-full rounded-[1.75rem] bg-white/78 border border-white px-5 py-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Coins className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-mirrorly-black">{t('Kredi Cuzdani')}</h3>
              <p className="text-sm text-mirrorly-stone">
                {t('Kullanilabilir bakiye: {{credits}} kredi', { credits: customerProfile.credits })}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={onOpenHistory}
          className="w-full rounded-[1.75rem] bg-white/78 border border-white px-5 py-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <History className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-mirrorly-black">{t('Deneme Gecmisi')}</h3>
              <p className="text-sm text-mirrorly-stone">{t('Kayitli son gorunumlerini gor')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={onOpenDiscover}
          className="w-full rounded-[1.75rem] bg-mirrorly-black text-white px-5 py-5 shadow-xl text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-boutique-gold" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45 mb-2">{t('Kesfet')}</p>
              <h3 className="font-serif text-xl mb-2">{t('Butikleri gezmeye basla')}</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {t('Giris yapan kullanici artik QR disinda da urun gezebiliyor. Kesfet akisini ac.')}
              </p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onOpenFavorites}
            className="rounded-[1.5rem] bg-white/72 border border-white px-4 py-5 text-left"
          >
            <Heart className="w-5 h-5 text-gray-700 mb-3" />
            <p className="font-serif text-lg text-mirrorly-black">{t('Favoriler')}</p>
            <p className="text-xs text-mirrorly-stone mt-1">{t('Kaydettigin urunler')}</p>
          </button>

          <div className="rounded-[1.5rem] bg-white/72 border border-white px-4 py-5">
            <Coins className="w-5 h-5 text-gray-700 mb-3" />
            <p className="font-serif text-lg text-mirrorly-black">{t('Bakiye Kurali')}</p>
            <p className="text-xs text-mirrorly-stone mt-1">{t('Giris yaptiktan sonraki try-on denemeleri kredi ile calisir.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;
