import React, { useState } from 'react';
import { ArrowLeft, Chrome, ShieldCheck } from 'lucide-react';

interface CustomerAuthProps {
  onBack: () => void;
  onGoogleSignIn: () => Promise<void>;
  isPending?: boolean;
}

const CustomerAuth: React.FC<CustomerAuthProps> = ({ onBack, onGoogleSignIn, isPending = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await onGoogleSignIn();
    } catch (err: any) {
      setError(err?.message || 'Google girisi basarisiz oldu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-7 pb-10">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-white/80 border border-gray-200 shadow-xl flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-gray-900" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gray-400 mb-3">
              Mirrorly
            </p>
            <h2 className="font-serif text-3xl text-gray-900 mb-3">
              {isPending ? 'Giris tamamlanıyor' : 'Google ile devam et'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isPending
                ? 'Google onayindan sonra oturumun cihaza geri yazilmasi birkac saniye surebilir.'
                : 'Hesabina girerek favorilerini kaydedebilir, deneme gecmisini gorebilir ve kesfet akisini kullanabilirsin.'}
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isPending}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gray-900 text-white py-4 shadow-xl hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5" />
            <span className="font-medium">
              {isPending ? 'Oturum tamamlanıyor...' : isSubmitting ? 'Google baglaniyor...' : 'Google ile giris yap'}
            </span>
          </button>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-white px-5 py-5">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400 mb-3">Girisle acilanlar</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Google ile tek tik giris</li>
              <li>Favori urunlerini kaydetme</li>
              <li>Bulut gecmisine erisim</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
