import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Home,
  Instagram,
  Link2,
  MessageCircle,
  RefreshCw,
  Share2,
  ShoppingBag,
  Twitter,
  X,
} from 'lucide-react';
import { Garment, MerchantPublicProfile, ProcessingResult } from '../types';

interface ResultViewProps {
  result: ProcessingResult;
  garment: Garment;
  merchantProfile: MerchantPublicProfile | null;
  onRetake: () => void;
  onHome: () => void;
}

const buildWhatsAppHref = (phone: string, garmentName: string) => {
  let phoneNum = phone.replace(/[^\d]/g, '');
  if (phoneNum.startsWith('0') && phoneNum.length === 11) {
    phoneNum = '90' + phoneNum.substring(1);
  } else if (phoneNum.startsWith('5') && phoneNum.length === 10) {
    phoneNum = '90' + phoneNum;
  }
  const text = encodeURIComponent(`${garmentName} urunu hakkinda bilgi almak istiyorum.`);
  return phoneNum ? `https://wa.me/${phoneNum}?text=${text}` : '';
};

const resolvePurchaseAction = (
  garment: Garment,
  merchantProfile: MerchantPublicProfile | null
): { label: string; href?: string } => {
  if (garment.shopUrl) {
    return { label: 'Online Satin Al', href: garment.shopUrl };
  }

  if (merchantProfile?.defaultShopUrl) {
    return { label: 'Online Satin Al', href: merchantProfile.defaultShopUrl };
  }

  if (merchantProfile?.whatsappNumber) {
    return {
      label: 'Magaza ile Iletisim',
      href: buildWhatsAppHref(merchantProfile.whatsappNumber, garment.name),
    };
  }

  return { label: 'Bilgi Al' };
};

const ResultView: React.FC<ResultViewProps> = ({
  result,
  garment,
  merchantProfile,
  onRetake,
  onHome,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [noCtaVisible, setNoCtaVisible] = useState(false);
  const purchaseAction = resolvePurchaseAction(garment, merchantProfile);

  if (!result.success) {
    const isMerchantCreditError =
      (result.message || '').toLowerCase().includes('yeterli kredi') ||
      (result.message || '').toLowerCase().includes('kredi gerektiriyor');

    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center p-8 text-center bg-boutique-cream relative">
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <button
            onClick={onRetake}
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

        {isMerchantCreditError ? (
          <>
            <h3 className="font-serif text-2xl text-gray-900 mb-4">Bu Butik Şu An Dolu</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
              Bu mağazanın deneme kapasitesi dolmuş. Daha sonra tekrar deneyin veya başka bir butiki keşfedin.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-serif text-2xl text-gray-900 mb-4">Ayna netlesemedi</h3>
            <p className="text-gray-600 mb-8">{result.message}</p>
          </>
        )}

        <button
          onClick={onRetake}
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-sans text-sm uppercase tracking-wide"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const handleBuy = () => {
    if (!purchaseAction.href) {
      setNoCtaVisible(true);
      return;
    }
    window.open(purchaseAction.href, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(result.imageUrl);
      if (!response.ok) {
        throw new Error('Remote image fetch failed.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `mirrorly-${garment.name.replace(/\s+/g, '-').toLowerCase()}-tryon.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      setShowShareModal(false);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(result.imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShowShareModal(true);
      return;
    }

    try {
      const response = await fetch(result.imageUrl);
      if (!response.ok) {
        throw new Error('Remote image fetch failed.');
      }

      const blob = await response.blob();
      const file = new File([blob], 'mirrorly-tryon.png', { type: 'image/png' });

      await navigator.share({
        title: `${garment.name} - Mirrorly`,
        text: `Bu gorunumu Mirrorly ile olusturdum: ${garment.name}`,
        files: [file],
      });
      setShowShareModal(false);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }

      try {
        await navigator.share({
          title: `${garment.name} - Mirrorly`,
          text: `Bu gorunumu Mirrorly ile olusturdum: ${garment.name}`,
          url: result.imageUrl,
        });
        setShowShareModal(false);
      } catch (shareError: any) {
        if (shareError?.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    }
  };

  const shareText = encodeURIComponent(`Mirrorly ile ${garment.name} denedim.`);
  const shareUrl = encodeURIComponent(window.location.href);

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
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in relative overflow-y-auto">
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          onClick={onRetake}
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

      <div className="flex-1 min-h-0 relative overflow-hidden bg-gray-100">
        <img src={result.imageUrl} alt="Virtual Try-On Result" className="w-full h-full object-cover" />
        {result.mode === 'demo' && (
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/88 backdrop-blur-md shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.22em] text-gray-700">
              Demo Onizleme
            </span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-boutique-cream via-boutique-cream/90 to-transparent" />
      </div>

      <div className="relative z-10 -mt-16 sm:-mt-20 w-full px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {result.mode === 'demo' && (
          <div className="mb-4 mx-auto max-w-sm rounded-2xl bg-white/82 backdrop-blur-md px-4 py-3 text-center shadow-sm">
            <p className="text-xs text-gray-600 leading-relaxed">
              Bu gorsel demo onizlemedir. Gercek AI giydirme servisi baglandiginda ayni akista
              canli sonuc gosterilecek.
            </p>
          </div>
        )}

        {/* Ürün ve butik bilgisi */}
        <div className="mx-auto max-w-sm mb-5 text-center">
          <h2 className="font-serif text-xl text-gray-900 mb-1">{garment.name}</h2>
          {merchantProfile && (
            <div className="flex items-center justify-center gap-2">
              {merchantProfile.logoUrl && (
                <img
                  src={merchantProfile.logoUrl}
                  alt={merchantProfile.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-500 font-sans">{merchantProfile.name}</span>
            </div>
          )}
        </div>

        {/* CTA bölümü */}
        <div className="mx-auto max-w-sm space-y-3 mb-6">
          {/* Ana CTA — tam genişlik */}
          <button
            onClick={handleBuy}
            className="w-full h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-sans font-semibold text-base tracking-wide">{purchaseAction.label}</span>
          </button>

          {noCtaVisible && (
            <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              Bu ürün için henüz satış veya iletişim bilgisi eklenmemiş.
            </p>
          )}

          {/* İkincil aksiyonlar */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRetake}
              className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Paylaş
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onHome}
            className="text-xs text-gray-400 font-sans tracking-wide uppercase hover:text-gray-600"
          >
            Ana Ekrana Dön
          </button>
        </div>
      </div>

      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-gray-900">Gorunumu Paylas</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-black transition-colors"
            >
              <Download className="w-5 h-5" />
              Gorseli Indir
            </button>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => window.open(`https://wa.me/?text=${shareText}%20${shareUrl}`, '_blank')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs text-gray-600">WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  handleDownload();
                }}
                className="flex flex-col items-center gap-2 p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span className="text-xs text-gray-600">Instagram</span>
              </button>

              <button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
                    '_blank'
                  )
                }
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Twitter className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-gray-600">Twitter</span>
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Kopyalandi</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Baglantiyi Kopyala</span>
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
