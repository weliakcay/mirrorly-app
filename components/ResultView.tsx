import React from 'react';
import { ProcessingResult, Garment } from '../types';
import { Share2, RefreshCw, ShoppingBag } from 'lucide-react';

interface ResultViewProps {
  result: ProcessingResult;
  garment: Garment;
  onRetake: () => void;
  onTryAnother: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, garment, onRetake, onTryAnother }) => {
  
  if (!result.success) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-boutique-cream">
        <h3 className="font-serif text-2xl text-gray-900 mb-4">The mirror is foggy.</h3>
        <p className="text-gray-600 mb-8">{result.message}</p>
        <button 
          onClick={onRetake}
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-sans text-sm uppercase tracking-wide"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handleBuy = () => {
    if (garment.shopUrl) {
        window.open(garment.shopUrl, '_blank');
    } else {
        alert('This item is available in-store only. Please ask an associate.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-boutique-cream animate-fade-in relative">
      
      {/* Hero Image */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        <img 
          src={result.imageUrl} 
          alt="Virtual Try-On Result" 
          className="w-full h-full object-cover"
        />
        {/* Subtle Gradient for controls visibility */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-boutique-cream via-boutique-cream/90 to-transparent"></div>
      </div>

      {/* Controls Overlay (Sticky Bottom) */}
      <div className="absolute bottom-0 w-full px-6 pb-8 pt-4">
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <button 
            onClick={onRetake}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <div className="w-12 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase tracking-wide">Retry</span>
          </button>

          <button 
            onClick={handleBuy}
            className="flex-1 max-w-[200px] h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-sans font-medium">
                {garment.shopUrl ? 'Buy Online' : 'In Boutique'}
            </span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <div className="w-12 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase tracking-wide">Share</span>
          </button>
        </div>

        <div className="text-center">
            <button onClick={onTryAnother} className="text-xs text-gray-400 font-sans tracking-wide uppercase hover:text-gray-600">
                Powered by Mirrorly
            </button>
        </div>
      </div>

    </div>
  );
};

export default ResultView;