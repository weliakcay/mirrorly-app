import React, { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1500); // 1.5s duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-boutique-cream animate-fade-out" style={{ animationDelay: '1s' }}>
      <div className="text-center animate-fade-in">
        <h1 className="font-serif text-5xl italic text-gray-900 tracking-wide">Mirrorly</h1>
      </div>
    </div>
  );
};

export default Splash;