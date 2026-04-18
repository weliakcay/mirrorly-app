import React from 'react';
import { ArrowLeft, ChevronRight, Clock, Coins, Sparkles } from 'lucide-react';
import {
  CUSTOMER_CREDIT_PACKAGES,
  CustomerCreditPack,
  CustomerProfile,
  MODEL_PRESET_OPTIONS,
} from '../types';
import { openCustomerCheckout } from '../services/billingService';

interface CustomerCreditsViewProps {
  customerProfile: CustomerProfile;
  notice?: string;
  onBack: () => void;
  onAddCredits: (pack: CustomerCreditPack) => Promise<void>;
  onSelectModelPreset: (preset: typeof MODEL_PRESET_OPTIONS[number]['value']) => Promise<void>;
}

const CustomerCreditsView: React.FC<CustomerCreditsViewProps> = ({
  customerProfile,
  notice,
  onBack,
  onAddCredits,
  onSelectModelPreset,
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">Krediler</p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <div className="rounded-[2rem] bg-gray-900 text-white px-6 py-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45 mb-2">
                Kullanilabilir Bakiye
              </p>
              <div className="flex items-center gap-3">
                <Coins className="w-7 h-7 text-boutique-gold" />
                <span className="font-serif text-4xl">{customerProfile.credits}</span>
              </div>
              <p className="text-sm text-white/70 mt-3">
                Giris yaptiktan sonra try-on denemeleri bu bakiyeden dusulur.
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-boutique-gold" />
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {notice}
          </div>
        )}

        <div className="rounded-[1.75rem] bg-white/82 border border-white px-5 py-5 shadow-sm">
          <h3 className="font-serif text-2xl text-gray-900">Kredi Paketleri</h3>
          <p className="text-sm text-gray-500 mt-2">
            Paket secerek bakiyene aninda kredi ekleyebilirsin.
          </p>
        </div>

        <div className="space-y-3">
          {CUSTOMER_CREDIT_PACKAGES.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                if (!openCustomerCheckout(pack, customerProfile.uid)) {
                  void onAddCredits(pack);
                }
              }}
              className="w-full rounded-[1.75rem] bg-white border border-gray-200 px-5 py-5 text-left shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-gray-900">{pack.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{pack.description}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mt-3">
                    {pack.credits} kredi yukler
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-medium">
                    +{pack.credits}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[1.75rem] bg-white/82 border border-white px-5 py-5 shadow-sm">
          <h3 className="font-serif text-2xl text-gray-900">Model Bazli Kullanim</h3>
          <div className="mt-4 space-y-3">
            {MODEL_PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => void onSelectModelPreset(option.value)}
                className={`w-full text-left flex flex-col gap-2 rounded-2xl border px-4 py-4 transition-colors ${
                  (customerProfile.modelPreset || 'balanced') === option.value
                    ? 'border-boutique-gold bg-boutique-gold/10'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">{option.badge}</span>
                </div>
                <p className="text-sm text-gray-500">{option.tool}</p>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-900">{option.creditCost} kredi</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {option.waitTime}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreditsView;
