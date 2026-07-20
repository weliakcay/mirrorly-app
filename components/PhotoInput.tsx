import React, { useRef } from 'react';
import { Camera, Upload, ArrowLeft, Home } from 'lucide-react';

interface PhotoInputProps {
  onPhotoSelected: (file: File) => void;
  onBack: () => void;
  onHome: () => void;
}

const PhotoInput: React.FC<PhotoInputProps> = ({ onPhotoSelected, onBack, onHome }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onPhotoSelected(file);
      // Reset input so if user selects same file again (after a retry), it triggers
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in relative overflow-y-auto">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-mirrorly-black" />
        </button>

        <button
          onClick={onHome}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Home className="w-5 h-5 text-mirrorly-black" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pt-20 pb-10">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-mirrorly-gold text-[11px] uppercase tracking-[0.3em] font-semibold">Adim 02 &middot; Kendini Cek</p>
            <h2 className="font-serif text-4xl text-mirrorly-black">Goruntunu yukle</h2>
            <p className="font-sans text-mirrorly-stone font-light leading-relaxed">
              Net kadraj ve iyi isik, daha iyi bir deneme sonucu verir.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {/* Ornek cekim referansi */}
            <div className="flex items-center gap-3 rounded-2xl border border-mirrorly-gold/25 bg-mirrorly-paper/40 px-4 py-3">
              <img
                src="/brand/step-photo.jpg"
                alt="Ideal fotograf ornegi"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm shrink-0"
              />
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.22em] text-mirrorly-gold font-semibold mb-0.5">Ornek cekim</p>
                <p className="text-xs text-mirrorly-stone leading-snug">Boyle net kadrajli, iyi isikli bir fotograf ideal sonucu verir.</p>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border border-mirrorly-paper rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4 group active:bg-mirrorly-cream"
            >
              <div className="w-16 h-16 rounded-full bg-mirrorly-cream flex items-center justify-center group-hover:bg-mirrorly-paper transition-colors">
                <Camera className="w-8 h-8 text-mirrorly-stone" />
              </div>
              <span className="font-serif text-xl text-mirrorly-black">Fotograf cek</span>
            </button>

            <button
              onClick={triggerUpload}
              className="w-full p-4 text-center"
            >
              <span className="inline-flex items-center gap-2 text-mirrorly-stone hover:text-mirrorly-black transition-colors font-sans text-sm tracking-wide uppercase">
                <Upload className="w-4 h-4" />
                Galeriden yukle
              </span>
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-mirrorly-paper/25 border border-mirrorly-paper/70 px-5 py-4 text-sm text-mirrorly-stone leading-relaxed">
            Tek bir fotograf yeterli. Urunun gorunecegi bolgeyi kapatmayan, temiz ve net bir
            kare secmeye calis.
          </div>

          {/* Rehber ipuçları */}
          <div className="mt-4 p-4 bg-mirrorly-paper/40 rounded-2xl border border-mirrorly-paper space-y-2">
            <p className="text-xs font-medium text-mirrorly-gold uppercase tracking-[0.2em]">En iyi sonuç için</p>
            <ul className="space-y-1.5">
              {[
                'Düz, sade arka planlı fotoğraf kullanın',
                'Yüzünüz ve vücudunuz tam görünsün',
                'İyi aydınlatılmış ortamda çekin',
                'Sizi tam kaplayan kıyafet tercih edin',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-mirrorly-stone">
                  <span className="text-mirrorly-gold mt-0.5">✦</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoInput;
