import React, { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    // QR ile gelen kullanici (?id=...) urununu beklemeden gormeli → splash'i kisalt.
    const hasDeepLink =
      typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('id'));
    const timer = setTimeout(() => {
      onComplete();
    }, hasDeepLink ? 500 : 2000); // logolu intro suresi (deep-link'te kisa)

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-out overflow-hidden"
      style={{ animationDelay: '1.5s', backgroundColor: '#ffffff' }}
    >
      {/* Sicak butik parildamasi */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 45%, rgba(212,175,55,0.10), rgba(253,251,247,0) 70%)',
        }}
      />

      <div className="relative flex flex-col items-center animate-fade-in px-8">
        <img
          src="/mirrorly-logo.png"
          alt="Mirrorly"
          className="w-56 sm:w-64 max-w-[70vw] h-auto select-none"
          draggable={false}
          onError={(e) => {
            // Logo yuklenemezse zarif metin fallback
            const el = e.currentTarget;
            el.style.display = 'none';
            const fb = el.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = 'block';
          }}
        />
        <h1
          className="font-serif text-5xl italic text-gray-900 tracking-wide"
          style={{ display: 'none' }}
        >
          Mirrorly
        </h1>

        {/* Ince altin shimmer cizgisi */}
        <div className="mt-6 h-px w-40 overflow-hidden rounded-full bg-boutique-gold/20">
          <div className="h-full w-1/2 bg-boutique-gold/80 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default Splash;
