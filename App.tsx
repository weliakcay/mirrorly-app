import React, { useState, useEffect } from 'react';
import { AppState, Garment, MOCK_GARMENTS, ProcessingResult, MerchantProfile, DEFAULT_PROFILE } from './types';
import Splash from './components/Splash';
import Landing from './components/Landing';
import GarmentView from './components/GarmentView';
import PhotoInput from './components/PhotoInput';
import Processing from './components/Processing';
import ResultView from './components/ResultView';
import MerchantDashboard from './components/MerchantDashboard';
import CustomerHistory from './components/CustomerHistory';
import { generateTryOnImage } from './services/geminiService';
import { getGarmentById, getMerchantProfile, isFirebaseConfigured, getGarmentsFromDb, updateMerchantCredits } from './services/firebase';
import { saveToHistory } from './services/historyService';

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
    const params = new URLSearchParams(window.location.search);
    const garmentId = params.get('id');

    if (garmentId) {
      setIsLoadingData(true);

      let garment: Garment | null = null;

      if (isFirebaseConfigured()) {
        garment = await getGarmentById(garmentId);
      }

      if (!garment) {
        garment = inventory.find(g => g.id === garmentId) || null;
      }

      setIsLoadingData(false);

      if (garment) {
        setSelectedGarment(garment);
        setCurrentState(AppState.GARMENT_VIEW);
      } else {
        setCurrentState(AppState.LANDING);
      }
    } else {
      setCurrentState(AppState.LANDING);
    }
  };

  const handleGarmentContinue = () => {
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleMerchantLoginRequest = () => {
    setCurrentState(AppState.MERCHANT_DASHBOARD);
  };

  const handlePhotoSelected = (file: File) => {
    if (!selectedGarment) return;

    // 1. CRITICAL FIX: Update state FIRST to show loading screen immediately
    setUserPhoto(file);
    setCurrentState(AppState.PROCESSING);

    // 2. Add a delay to allow UI to repaint "Processing" screen before heavy JS starts
    setTimeout(() => {
      processImageFile(file);
    }, 500);
  };

  const processImageFile = async (file: File) => {
    if (!selectedGarment) return;

    // --- CREDIT CHECK ---
    if (merchantProfile.credits <= 0) {
      setResult({
        success: false,
        imageUrl: "",
        message: "Krediniz bitti! Mağaza panelinizden kredi satın alabilirsiniz."
      });
      setCurrentState(AppState.RESULT);
      return;
    }

    // Use a try-catch block around the FileReader to handle memory errors
    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;

          // Call Gemini Service (uses central API key from env)
          const apiResult = await generateTryOnImage(
            base64String,
            selectedGarment
          );

          if (apiResult.success && apiResult.imageUrl) {
            saveToHistory(selectedGarment, apiResult.imageUrl);

            // Deduct 1 credit on successful try-on
            const newCredits = merchantProfile.credits - 1;
            setMerchantProfile(prev => ({ ...prev, credits: newCredits }));

            // Update in Firebase and localStorage
            if (isFirebaseConfigured()) {
              await updateMerchantCredits(newCredits);
            }
            localStorage.setItem('mirrorly_profile', JSON.stringify({ ...merchantProfile, credits: newCredits }));
          }

          setResult(apiResult);
          setCurrentState(AppState.RESULT);

        } catch (e) {
          console.error("API Error:", e);
          setResult({
            success: false,
            imageUrl: "",
            message: "Görsel işlenirken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin."
          });
          setCurrentState(AppState.RESULT);
        }
      };

      reader.onerror = () => {
        setResult({
          success: false,
          imageUrl: "",
          message: "Fotoğraf okunamadı. Dosya bozuk olabilir veya izin verilmedi."
        });
        setCurrentState(AppState.RESULT);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("FileReader Error:", err);
      setResult({
        success: false,
        imageUrl: "",
        message: "Fotoğraf çok büyük veya cihaz belleği yetersiz."
      });
      setCurrentState(AppState.RESULT);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setUserPhoto(null);
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleCancelProcessing = () => {
    // Allows user to abort if it takes too long
    setResult(null);
    setUserPhoto(null);
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleTryAnother = () => {
    setResult(null);
    setUserPhoto(null);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
    setCurrentState(AppState.LANDING);
  };

  const renderContent = () => {
    if (isLoadingData) {
      return <Processing />;
    }

    switch (currentState) {
      case AppState.SPLASH:
        return <Splash onComplete={handleSplashComplete} />;

      case AppState.LANDING:
        return (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={() => setCurrentState(AppState.CUSTOMER_HISTORY)}
          />
        );

      case AppState.CUSTOMER_HISTORY:
        return <CustomerHistory onBack={() => setCurrentState(AppState.LANDING)} />;

      case AppState.GARMENT_VIEW:
        return selectedGarment ? (
          <GarmentView
            garment={selectedGarment}
            merchantProfile={merchantProfile}
            inventory={inventory}
            onContinue={handleGarmentContinue}
            onMerchantClick={handleMerchantLoginRequest}
            onSelectGarment={(g) => setSelectedGarment(g)}
            onBack={() => setCurrentState(AppState.LANDING)}
          />
        ) : <Landing onMerchantLogin={handleMerchantLoginRequest} onOpenHistory={() => setCurrentState(AppState.CUSTOMER_HISTORY)} />;

      case AppState.PHOTO_INPUT:
        return <PhotoInput onPhotoSelected={handlePhotoSelected} onBack={() => setCurrentState(AppState.GARMENT_VIEW)} />;

      case AppState.PROCESSING:
        // Pass the cancel handler here
        return <Processing onCancel={handleCancelProcessing} />;

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