import React, { useEffect, useState } from 'react';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

interface ProcessingProps {
  onCancel?: () => void;
  onBack?: () => void;
  onHome?: () => void;
}

const PHASE_MESSAGES = [
  { time: 0, text: "Fotoğrafın analiz ediliyor..." },
  { time: 15, text: "Kıyafet vücuda uyumlanıyor..." },
  { time: 30, text: "Detaylar ince ayarlanıyor..." },
  { time: 50, text: "Son rötuşlar yapılıyor..." }
];

const FUN_FACTS = [
  "Yapay zeka kumaş dokusunu piksel piksel analiz ediyor",
  "Kıyafetin gölge ve ışık açıları hesaplanıyor",
  "Beden oranları fotoğrafa uyumlu hale getiriliyor",
  "Renk tonu kalibrasyonu yapılıyor",
  "Vücut hatları saptanıyor",
  "3D sınırlar çiziliyor"
];

const Processing: React.FC<ProcessingProps> = ({ onCancel, onBack, onHome }) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(PHASE_MESSAGES[0].text);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / 75);
        return next > 100 ? 100 : next;
      });
    }, 1000);

    const messageInterval = setInterval(() => {
      setProgress(prev => {
        const timeElapsed = (prev / 100) * 75;
        for (let i = PHASE_MESSAGES.length - 1; i >= 0; i--) {
          if (timeElapsed >= PHASE_MESSAGES[i].time) {
            setCurrentMessage(PHASE_MESSAGES[i].text);
            break;
          }
        }
        return prev;
      });
    }, 2000);

    const factInterval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(factInterval);
    };
  }, []);

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
        <div className="relative w-48 h-64 sm:w-64 sm:h-80 mb-4 sm:mb-6">
          <div className="absolute inset-0 border border-gray-200 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 border border-boutique-gold/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-boutique-gold animate-bounce" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 w-full h-full rounded-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>

        <div className="w-full space-y-4">
          <div className="h-12 overflow-hidden text-center">
            <p className="font-serif text-xl text-gray-600">
              {currentMessage}
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-boutique-gold to-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 italic leading-relaxed">
              💡 {FUN_FACTS[factIndex]}
            </p>
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
