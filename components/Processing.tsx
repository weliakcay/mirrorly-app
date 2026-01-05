import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const MESSAGES = [
  "Measuring starlight...",
  "Weaving pixels...",
  "Adjusting the fit...",
  "Almost ready..."
];

const Processing: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-boutique-cream flex flex-col items-center justify-center z-40 animate-fade-in">
      
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

      <div className="h-8 overflow-hidden text-center">
        <p className="font-serif text-2xl italic text-gray-600 animate-fade-in key={messageIndex}">
          {MESSAGES[messageIndex]}
        </p>
      </div>

    </div>
  );
};

export default Processing;