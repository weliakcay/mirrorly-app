import React, { useState } from 'react';
import { ProcessingResult, Garment } from '../types';
import { Share2, RefreshCw, ShoppingBag, Download, X, MessageCircle, Instagram, Twitter, Link2, Check } from 'lucide-react';

interface ResultViewProps {
  result: ProcessingResult;
  garment: Garment;
  onRetake: () => void;
  onTryAnother: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, garment, onRetake, onTryAnother }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Download image function
  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `mirrorly-${garment.name.replace(/\s+/g, '-').toLowerCase()}-tryon.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowShareModal(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('İndirme başarısız oldu. Lütfen görsel üzerinde sağ tıklayıp kaydedin.');
    }
  };

  // Native share (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'mirrorly-tryon.png', { type: 'image/png' });

        await navigator.share({
          title: `${garment.name} - Virtual Try-On`,
          text: `Check out how I look in this ${garment.name}! ✨ Powered by Mirrorly`,
          files: [file]
        });
        setShowShareModal(false);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          // Fallback to showing modal if native share fails
        }
      }
    } else {
      // Show modal for non-supporting browsers
      setShowShareModal(true);
    }
  };

  // Social share handlers
  const shareText = encodeURIComponent(`Check out how I look in this ${garment.name}! ✨ Powered by Mirrorly`);
  const shareUrl = encodeURIComponent(window.location.href);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareText}%20${shareUrl}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
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
            onClick={handleNativeShare}
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-gray-900">Share Your Look</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Download Button - Primary */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-black transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Image
            </button>

            {/* Social Share Options */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs text-gray-600">WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  // Instagram requires opening the app - download first
                  handleDownload();
                  alert('Görsel indirildi. Instagram uygulamasını açıp story olarak paylaşabilirsiniz.');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span className="text-xs text-gray-600">Instagram</span>
              </button>

              <button
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Twitter className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-gray-600">Twitter</span>
              </button>
            </div>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResultView;