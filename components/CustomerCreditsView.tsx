import React from 'react';
import { ArrowLeft, ChevronRight, Coins, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CUSTOMER_CREDIT_PACKAGES,
  CustomerCreditPack,
  CustomerProfile,
} from '../types';
import { openCustomerCheckout } from '../services/billingService';

interface CustomerCreditsViewProps {
  customerProfile: CustomerProfile;
  notice?: string;
  onBack: () => void;
  onAddCredits: (pack: CustomerCreditPack) => Promise<void>;
}

const CustomerCreditsView: React.FC<CustomerCreditsViewProps> = ({
  customerProfile,
  notice,
  onBack,
  onAddCredits,
}) => {
  const { t } = useTranslation();
  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-mirrorly-black" />
        </button>

        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">{t('Krediler')}</p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <div className="rounded-[2rem] bg-mirrorly-black text-white px-6 py-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45 mb-2">
                {t('Kullanilabilir Bakiye')}
              </p>
              <div className="flex items-center gap-3">
                <Coins className="w-7 h-7 text-boutique-gold" />
                <span className="font-serif text-4xl">{customerProfile.credits}</span>
              </div>
              <p className="text-sm text-white/70 mt-3">
                {t('Giris yaptiktan sonra try-on denemeleri bu bakiyeden dusulur.')}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-boutique-gold" />
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {t(notice)}
          </div>
        )}

        {import.meta.env.VITE_CUSTOMER_PACKS_ENABLED !== 'true' ? (
          // v1: müşteri kredi paketleri kapalı (merchant-pays modeli) — QR denemeleri ücretsiz.
          <div className="rounded-[1.75rem] bg-white/82 border border-white px-5 py-6 shadow-sm text-center">
            <h3 className="font-serif text-xl text-mirrorly-black">{t('QR ile denemeler ücretsiz')}</h3>
            <p className="text-sm text-mirrorly-stone mt-2 leading-relaxed">
              {t('Mağazadaki QR etiketini okutup kıyafeti kendi üstünde görebilirsin — ekstra krediye gerek yok.')}
            </p>
          </div>
        ) : (
        <div className="rounded-[1.75rem] bg-white/82 border border-white px-5 py-5 shadow-sm">
          <h3 className="font-serif text-2xl text-mirrorly-black">{t('Kredi Paketleri')}</h3>
          <p className="text-sm text-mirrorly-stone mt-2">
            {t('Paket secerek bakiyene aninda kredi ekleyebilirsin.')}
          </p>
        </div>
        )}

        <div className={`space-y-3 ${import.meta.env.VITE_CUSTOMER_PACKS_ENABLED !== 'true' ? 'hidden' : ''}`}>
          {CUSTOMER_CREDIT_PACKAGES.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                if (!openCustomerCheckout(pack, customerProfile.uid)) {
                  void onAddCredits(pack);
                }
              }}
              className="w-full rounded-[1.75rem] bg-white border border-mirrorly-paper px-5 py-5 text-left shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-mirrorly-black">{t(pack.label)}</p>
                  <p className="text-sm text-mirrorly-stone mt-1">{t(pack.description)}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mt-3">
                    {t('{{credits}} kredi yukler', { credits: pack.credits })}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="rounded-full bg-mirrorly-black text-white px-4 py-2 text-sm font-medium">
                    +{pack.credits}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CustomerCreditsView;
