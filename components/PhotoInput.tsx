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
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <button
          onClick={onHome}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Home className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pt-20 pb-10">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-4xl text-gray-900">Goruntunu yukle</h2>
            <p className="font-sans text-gray-500 font-light leading-relaxed">
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

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4 group active:bg-gray-50"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <Camera className="w-8 h-8 text-gray-700" />
              </div>
              <span className="font-serif text-xl text-gray-900">Fotograf cek</span>
            </button>

            <button
              onClick={triggerUpload}
              className="w-full p-4 text-center"
            >
              <span className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors font-sans text-sm tracking-wide uppercase">
                <Upload className="w-4 h-4" />
                Galeriden yukle
              </span>
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-white/80 border border-white px-5 py-4 text-sm text-gray-500 leading-relaxed">
            Tek bir fotograf yeterli. Urunun gorunecegi bolgeyi kapatmayan, temiz ve net bir
            kare secmeye calis.
          </div>

          {/* Rehber ipuçları */}
          <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">En iyi sonuç için</p>
            <ul className="space-y-1.5">
              {[
                'Düz, sade arka planlı fotoğraf kullanın',
                'Yüzünüz ve vücudunuz tam görünsün',
                'İyi aydınlatılmış ortamda çekin',
                'Sizi tam kaplayan kıyafet tercih edin',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-boutique-gold mt-0.5">✦</span>
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
