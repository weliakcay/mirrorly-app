import React, { useEffect, useState } from 'react';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

interface ProcessingProps {
  onCancel?: () => void;
  onBack?: () => void;
  onHome?: () => void;
  // 'tryon' = gerçek giydirme (zengin animasyon + ilerleme).
  // 'loading' = ürün/veri yükleniyor (basit, yanıltıcı "fotoğraf analiz" metni YOK).
  variant?: 'tryon' | 'loading';
}

// Süreye göre mesaj (elapsed saniye eşiği). Son eşik uzun beklemeyi güvenceye alır.
const PHASE_MESSAGES = [
  { time: 0, text: 'Fotoğrafın analiz ediliyor...' },
  { time: 12, text: 'Kıyafet vücuda uyumlanıyor...' },
  { time: 26, text: 'Detaylar ince ayarlanıyor...' },
  { time: 42, text: 'Son rötuşlar yapılıyor...' },
  { time: 58, text: 'Neredeyse hazır, birkaç saniye daha...' },
];

const FUN_FACTS = [
  'Yapay zeka kumaş dokusunu piksel piksel analiz ediyor',
  'Kıyafetin gölge ve ışık açıları hesaplanıyor',
  'Beden oranları fotoğrafa uyumlu hale getiriliyor',
  'Renk tonu kalibrasyonu yapılıyor',
  'Vücut hatları saptanıyor',
  '3D sınırlar çiziliyor',
];

const LoadingRing: React.FC = () => (
  <div className="relative w-40 h-52 sm:w-56 sm:h-72 mb-4 sm:mb-6">
    <div className="absolute inset-0 border border-gray-200 rounded-full animate-pulse" />
    <div className="absolute inset-4 border border-boutique-gold/30 rounded-full animate-[spin_8s_linear_infinite]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-boutique-gold animate-bounce" />
    </div>
    <div
      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 w-full h-full rounded-full animate-shimmer"
      style={{ backgroundSize: '200% 100%' }}
    />
  </div>
);

const Processing: React.FC<ProcessingProps> = ({ onCancel, onBack, onHome, variant = 'tryon' }) => {
  const [elapsed, setElapsed] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    if (variant !== 'tryon') return;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    const factInterval = setInterval(() => setFactIndex((prev) => (prev + 1) % FUN_FACTS.length), 5000);
    return () => {
      clearInterval(tick);
      clearInterval(factInterval);
    };
  }, [variant]);

  // Basit yükleme (ürün/veri) — yanıltıcı giydirme metni yok.
  if (variant !== 'tryon') {
    return (
      <div className="absolute inset-0 bg-boutique-cream flex flex-col items-center justify-center z-40 animate-fade-in px-8 py-6">
        {(onBack || onHome) && (
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            {onBack ? (
              <button onClick={onBack} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </button>
            ) : <span />}
            {onHome ? (
              <button onClick={onHome} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
                <Home className="w-5 h-5 text-gray-900" />
              </button>
            ) : <span />}
          </div>
        )}
        <div className="flex flex-col items-center gap-6">
          <LoadingRing />
          <p className="font-serif text-xl text-gray-600">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Asimptotik ilerleme: ~%93'e yaklaşır, ASLA %100 olmaz → uzun beklemede "bitti ama takıldı" hissi vermez.
  const progress = Math.min(93, 93 * (1 - Math.exp(-elapsed / 20)));
  let currentMessage = PHASE_MESSAGES[0].text;
  for (let i = PHASE_MESSAGES.length - 1; i >= 0; i--) {
    if (elapsed >= PHASE_MESSAGES[i].time) {
      currentMessage = PHASE_MESSAGES[i].text;
      break;
    }
  }

  return (
    <div className="absolute inset-0 bg-boutique-cream flex flex-col items-center justify-center z-40 animate-fade-in px-8 py-6">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onBack || onCancel}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <button
          onClick={onHome}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Home className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-xs">
        <LoadingRing />

        <div className="w-full space-y-4">
          <div className="h-12 overflow-hidden text-center">
            <p className="font-serif text-xl text-gray-600">{currentMessage}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-boutique-gold to-amber-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 italic leading-relaxed">💡 {FUN_FACTS[factIndex]}</p>
          </div>
        </div>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 px-6 py-2 bg-white/70 border border-gray-200 rounded-full text-gray-600 hover:bg-white hover:text-gray-900 transition-colors text-xs uppercase tracking-wider font-medium"
        >
          İptal Et
        </button>
      )}
    </div>
  );
};

export default Processing;
