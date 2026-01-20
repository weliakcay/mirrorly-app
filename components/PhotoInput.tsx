import React, { useRef } from 'react';
import { Camera, Upload, ArrowLeft } from 'lucide-react';

interface PhotoInputProps {
  onPhotoSelected: (file: File) => void;
  onBack: () => void;
}

const PhotoInput: React.FC<PhotoInputProps> = ({ onPhotoSelected, onBack }) => {
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
    <div className="h-full flex flex-col items-center justify-center px-6 bg-boutique-cream animate-fade-in relative">

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="w-full max-w-md space-y-12">

        <div className="text-center space-y-2">
          <h2 className="font-serif text-4xl text-gray-900">Let's reflect.</h2>
          <p className="font-sans text-gray-500 font-light">Stand in good light for the best magic.</p>
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
            onClick={() => fileInputRef.current?.click()} // On mobile, this prompts Camera or Library
            className="w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4 group active:bg-gray-50"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <Camera className="w-8 h-8 text-gray-700" />
            </div>
            <span className="font-serif text-xl text-gray-900">Take a photo</span>
          </button>

          <button
            onClick={triggerUpload}
            className="w-full p-4 text-center"
          >
            <span className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors font-sans text-sm tracking-wide uppercase">
              <Upload className="w-4 h-4" />
              Or upload from gallery
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PhotoInput;