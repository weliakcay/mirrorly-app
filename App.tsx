import React, { useState, useEffect } from 'react';
import { AppState, Garment, MOCK_GARMENTS, ProcessingResult, MerchantProfile, DEFAULT_PROFILE } from './types';
import Splash from './components/Splash';
import Landing from './components/Landing';
import GarmentView from './components/GarmentView';
import PhotoInput from './components/PhotoInput';
import Processing from './components/Processing';
import ResultView from './components/ResultView';
import MerchantDashboard from './components/MerchantDashboard';
import { generateTryOnImage } from './services/geminiService';

const App: React.FC = () => {
  // Application State
  const [currentState, setCurrentState] = useState<AppState>(AppState.SPLASH);
  
  // Centralized Inventory & Profile State with LocalStorage Initialization
  const [inventory, setInventory] = useState<Garment[]>(() => {
    const saved = localStorage.getItem('mirrorly_inventory');
    return saved ? JSON.parse(saved) : MOCK_GARMENTS;
  });

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(() => {
    const saved = localStorage.getItem('mirrorly_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });
  
  // Data State
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('mirrorly_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('mirrorly_profile', JSON.stringify(merchantProfile));
  }, [merchantProfile]);

  // Transitions
  const handleSplashComplete = () => {
    // Check for URL parameters to determine if we are scanning a specific item
    const params = new URLSearchParams(window.location.search);
    const garmentId = params.get('id');

    console.log("Checking URL for ID:", garmentId);

    if (garmentId) {
      // Find garment in inventory
      const garment = inventory.find(g => g.id === garmentId);
      if (garment) {
        console.log("Garment found:", garment.name);
        setSelectedGarment(garment);
        setCurrentState(AppState.GARMENT_VIEW);
      } else {
        // ID not found, go to landing
        console.warn('Garment ID not found in current inventory');
        setCurrentState(AppState.LANDING);
      }
    } else {
      // No ID, standard entry
      setCurrentState(AppState.LANDING);
    }
  };

  const handleGarmentContinue = () => {
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleMerchantLoginRequest = () => {
    setCurrentState(AppState.MERCHANT_DASHBOARD);
  };

  const handlePhotoSelected = async (file: File) => {
    if (!selectedGarment) return;
    
    setUserPhoto(file);
    setCurrentState(AppState.PROCESSING);

    // Convert file to base64 for the API
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Call Gemini Service
      const apiResult = await generateTryOnImage(base64String, selectedGarment);
      
      setResult(apiResult);
      setCurrentState(AppState.RESULT);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setResult(null);
    setUserPhoto(null);
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleTryAnother = () => {
    setResult(null);
    setUserPhoto(null);
    // Remove ID from URL without refreshing to return to pure landing state
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({path: newUrl}, '', newUrl);
    setCurrentState(AppState.LANDING);
  };

  const renderContent = () => {
    switch (currentState) {
      case AppState.SPLASH:
        return <Splash onComplete={handleSplashComplete} />;
      
      case AppState.LANDING:
        return <Landing onMerchantLogin={handleMerchantLoginRequest} />;

      case AppState.GARMENT_VIEW:
        return selectedGarment ? (
          <GarmentView 
            garment={selectedGarment} 
            merchantProfile={merchantProfile}
            onContinue={handleGarmentContinue}
            onMerchantClick={handleMerchantLoginRequest}
          />
        ) : <Landing onMerchantLogin={handleMerchantLoginRequest} />;

      case AppState.PHOTO_INPUT:
        return <PhotoInput onPhotoSelected={handlePhotoSelected} />;

      case AppState.PROCESSING:
        return <Processing />;

      case AppState.RESULT:
        return result && selectedGarment ? (
          <ResultView 
            result={result}
            garment={selectedGarment}
            onRetake={handleRetake} 
            onTryAnother={handleTryAnother} 
          />
        ) : null;

      case AppState.MERCHANT_DASHBOARD:
        return (
            <MerchantDashboard 
                inventory={inventory}
                merchantProfile={merchantProfile}
                onUpdateInventory={setInventory}
                onUpdateProfile={setMerchantProfile}
                onBack={() => {
                    // Reset to landing
                    setCurrentState(AppState.LANDING);
                }} 
            />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen bg-neutral-100 flex items-center justify-center overflow-hidden">
      {/* 
        Container ensures mobile-app like feel on desktop, 
        or full width on actual mobile 
      */}
      <div className="w-full h-full sm:max-w-md sm:h-[850px] bg-boutique-cream sm:rounded-3xl sm:shadow-2xl overflow-hidden relative border-gray-200 sm:border">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;