import React, { useEffect, useState } from 'react';
import { Sparkles, XCircle } from 'lucide-react';

interface ProcessingProps {
  onCancel?: () => void;
}

const MESSAGES = [
  "Measuring starlight...",
  "Weaving pixels...",
  "Adjusting the fit...",
  "Almost ready..."
];

const Processing: React.FC<ProcessingProps> = ({ onCancel }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    // Message rotation
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);

    // Show cancel button after 10 seconds of waiting
    const cancelTimer = setTimeout(() => {
        setShowCancel(true);
    }, 10000);

    return () => {
        clearInterval(interval);
        clearTimeout(cancelTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-boutique-cream flex flex-col items-center justify-center z-40 animate-fade-in px-8">
      
      {/* Abstract Mirror Animation */}
      <div className="relative w-64 h-80 mb-12">
        <div className="absolute inset-0 border border-gray-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-4 border border-boutique-gold/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-boutique-gold animate-bounce" />
        </div>
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 w-full h-full rounded-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
      </div>

      <div className="h-20 overflow-hidden text-center max-w-xs mx-auto">
        <p className="font-serif text-2xl italic text-gray-600 animate-fade-in key={messageIndex}">
          {MESSAGES[messageIndex]}
        </p>
        {showCancel && (
            <p className="text-xs text-gray-400 mt-2 animate-fade-in">
                This is taking longer than usual...
            </p>
        )}
      </div>

      {showCancel && onCancel && (
          <button 
            onClick={onCancel}
            className="mt-8 flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors animate-fade-in"
          >
              <XCircle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-bold">Cancel</span>
          </button>
      )}

    </div>
  );
};

export default Processing;