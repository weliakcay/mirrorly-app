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
import { getGarmentById, getMerchantProfile, isFirebaseConfigured, getGarmentsFromDb } from './services/firebase';

const App: React.FC = () => {
  // Application State
  const [currentState, setCurrentState] = useState<AppState>(AppState.SPLASH);
  
  // Data State
  const [inventory, setInventory] = useState<Garment[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
        // 1. Load Profile
        if (isFirebaseConfigured()) {
            const profile = await getMerchantProfile();
            if (profile) setMerchantProfile(profile);
            
            // 2. Load Inventory (for dashboard mainly)
            // Optimization: We could only load this if merchant logs in, but for small boutiques loading all is fine.
            const items = await getGarmentsFromDb();
            if (items.length > 0) setInventory(items);
        } else {
            // Fallback to local storage if firebase not set up
            const savedInv = localStorage.getItem('mirrorly_inventory');
            if (savedInv) setInventory(JSON.parse(savedInv));
            
            const savedProf = localStorage.getItem('mirrorly_profile');
            if (savedProf) setMerchantProfile(JSON.parse(savedProf));
        }
    };
    fetchInitialData();
  }, []);

  // Transitions
  const handleSplashComplete = async () => {
    // Check for URL parameters to determine if we are scanning a specific item
    const params = new URLSearchParams(window.location.search);
    const garmentId = params.get('id');

    console.log("Checking URL for ID:", garmentId);

    if (garmentId) {
      setIsLoadingData(true);
      
      let garment: Garment | null = null;

      // Try fetching directly from DB first (Single source of truth)
      if (isFirebaseConfigured()) {
         garment = await getGarmentById(garmentId);
      } 
      
      // Fallback to local inventory state if DB failed or not configured
      if (!garment) {
         garment = inventory.find(g => g.id === garmentId) || null;
      }

      setIsLoadingData(false);

      if (garment) {
        console.log("Garment found:", garment.name);
        setSelectedGarment(garment);
        setCurrentState(AppState.GARMENT_VIEW);
      } else {
        console.warn('Garment ID not found');
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
      
      // Call Gemini Service with Dynamic API Key from Profile
      const apiResult = await generateTryOnImage(
          base64String, 
          selectedGarment, 
          merchantProfile.geminiApiKey
      );
      
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
    if (isLoadingData) {
        return <Processing />; // Reuse processing screen while fetching DB data
    }

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
      <div className="w-full h-full sm:max-w-md sm:h-[850px] bg-boutique-cream sm:rounded-3xl sm:shadow-2xl overflow-hidden relative border-gray-200 sm:border">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;