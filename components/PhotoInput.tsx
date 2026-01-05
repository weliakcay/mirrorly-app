import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

interface PhotoInputProps {
  onPhotoSelected: (file: File) => void;
}

const PhotoInput: React.FC<PhotoInputProps> = ({ onPhotoSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoSelected(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-boutique-cream animate-fade-in">
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
            onClick={() => fileInputRef.current?.click()} // On mobile, this usually prompts Camera or Library
            className="w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
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