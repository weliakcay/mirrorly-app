import React, { useEffect, useState } from 'react';
import {
  AppState,
  DEFAULT_PROFILE,
  Garment,
  MerchantProfile,
  MerchantPublicProfile,
  ProcessingResult,
} from './types';
import Splash from './components/Splash';
import Landing from './components/Landing';
import GarmentView from './components/GarmentView';
import PhotoInput from './components/PhotoInput';
import Processing from './components/Processing';
import ResultView from './components/ResultView';
import MerchantDashboard from './components/MerchantDashboard';
import CustomerHistory from './components/CustomerHistory';
import { generateTryOnImage } from './services/tryOnService';
import {
  getGarmentById,
  getGarmentsByMerchant,
  getMerchantPublicProfileByUid,
  isFirebaseConfigured,
} from './services/firebase';
import { saveToHistory } from './services/historyService';

const buildFallbackMerchant = (
  garment: Garment,
  merchantProfile: MerchantProfile
): MerchantPublicProfile => ({
  uid: garment.merchantUid || merchantProfile.uid || 'unknown-merchant',
  name: garment.boutiqueName || merchantProfile.name || 'Mirrorly Boutique',
  logoUrl: merchantProfile.uid === garment.merchantUid ? merchantProfile.logoUrl : undefined,
  description: merchantProfile.uid === garment.merchantUid ? merchantProfile.description : undefined,
  instagramUrl: merchantProfile.uid === garment.merchantUid ? merchantProfile.instagramUrl : undefined,
  defaultShopUrl:
    garment.shopUrl ||
    (merchantProfile.uid === garment.merchantUid ? merchantProfile.defaultShopUrl : undefined),
  whatsappNumber:
    merchantProfile.uid === garment.merchantUid ? merchantProfile.whatsappNumber : undefined,
});

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.SPLASH);

  const [merchantInventory, setMerchantInventory] = useState<Garment[]>([]);
  const [collectionInventory, setCollectionInventory] = useState<Garment[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantPublicProfile | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const savedInv = localStorage.getItem('mirrorly_inventory');
    if (savedInv) {
      try {
        setMerchantInventory(JSON.parse(savedInv));
      } catch {
        console.warn('Could not parse cached inventory');
      }
    }

    const savedProf = localStorage.getItem('mirrorly_profile');
    if (savedProf) {
      try {
        setMerchantProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProf) });
      } catch {
        console.warn('Could not parse cached profile');
      }
    }
  }, []);

  const loadGarmentExperience = async (garmentId: string) => {
    setIsLoadingData(true);

    try {
      let garment: Garment | null = null;

      if (isFirebaseConfigured()) {
        garment = await getGarmentById(garmentId);
      }

      if (!garment) {
        garment = merchantInventory.find((item) => item.id === garmentId) || null;
      }

      if (!garment) {
        setCurrentState(AppState.LANDING);
        return;
      }

      let merchant = buildFallbackMerchant(garment, merchantProfile);
      let sameMerchantInventory = merchantInventory.filter(
        (item) => item.merchantUid === garment?.merchantUid
      );

      if (isFirebaseConfigured() && garment.merchantUid) {
        const [publicProfile, merchantItems] = await Promise.all([
          getMerchantPublicProfileByUid(garment.merchantUid),
          getGarmentsByMerchant(garment.merchantUid),
        ]);

        if (publicProfile) {
          merchant = publicProfile;
        }

        if (merchantItems.length > 0) {
          sameMerchantInventory = merchantItems;
        }
      }

      setSelectedGarment(garment);
      setSelectedMerchant(merchant);
      setCollectionInventory(
        sameMerchantInventory.length > 0 ? sameMerchantInventory : [garment]
      );
      setCurrentState(AppState.GARMENT_VIEW);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSplashComplete = async () => {
    const params = new URLSearchParams(window.location.search);
    const garmentId = params.get('id');

    if (garmentId) {
      await loadGarmentExperience(garmentId);
      return;
    }

    setCurrentState(AppState.LANDING);
  };

  const handleGarmentContinue = () => {
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleMerchantLoginRequest = () => {
    setCurrentState(AppState.MERCHANT_DASHBOARD);
  };

  const handlePhotoSelected = (file: File) => {
    if (!selectedGarment) return;

    setUserPhoto(file);
    setCurrentState(AppState.PROCESSING);

    setTimeout(() => {
      processImageFile(file);
    }, 350);
  };

  const processImageFile = async (file: File) => {
    if (!selectedGarment) return;

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const apiResult = await generateTryOnImage(
          base64String,
          selectedGarment.id,
          selectedGarment.imageUrl,
          selectedGarment.name
        );

        if (apiResult.success && apiResult.imageUrl) {
          saveToHistory(selectedGarment, apiResult.imageUrl);

          if (
            typeof apiResult.remainingCredits === 'number' &&
            merchantProfile.uid &&
            merchantProfile.uid === selectedGarment.merchantUid
          ) {
            const updatedProfile = {
              ...merchantProfile,
              credits: apiResult.remainingCredits,
            };
            setMerchantProfile(updatedProfile);
            localStorage.setItem('mirrorly_profile', JSON.stringify(updatedProfile));
          }
        }

        setResult(apiResult);
        setCurrentState(AppState.RESULT);
      };

      reader.onerror = () => {
        setResult({
          success: false,
          imageUrl: '',
          message: 'Fotoğraf okunamadı. Lütfen tekrar deneyin.',
        });
        setCurrentState(AppState.RESULT);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Try-on flow error:', error);
      setResult({
        success: false,
        imageUrl: '',
        message: 'Görsel işlenirken bir sorun oluştu. Lütfen tekrar deneyin.',
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
    setResult(null);
    setUserPhoto(null);
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleTryAnother = () => {
    setResult(null);
    setUserPhoto(null);
    setSelectedGarment(null);
    setSelectedMerchant(null);
    setCollectionInventory([]);
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
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
            merchantProfile={selectedMerchant || buildFallbackMerchant(selectedGarment, merchantProfile)}
            inventory={collectionInventory}
            onContinue={handleGarmentContinue}
            onMerchantClick={handleMerchantLoginRequest}
            onSelectGarment={setSelectedGarment}
            onBack={() => setCurrentState(AppState.LANDING)}
          />
        ) : (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={() => setCurrentState(AppState.CUSTOMER_HISTORY)}
          />
        );

      case AppState.PHOTO_INPUT:
        return (
          <PhotoInput
            onPhotoSelected={handlePhotoSelected}
            onBack={() => setCurrentState(AppState.GARMENT_VIEW)}
          />
        );

      case AppState.PROCESSING:
        return <Processing onCancel={handleCancelProcessing} />;

      case AppState.RESULT:
        return result && selectedGarment ? (
          <ResultView
            result={result}
            garment={selectedGarment}
            merchantProfile={
              selectedMerchant || buildFallbackMerchant(selectedGarment, merchantProfile)
            }
            onRetake={handleRetake}
            onTryAnother={handleTryAnother}
          />
        ) : null;

      case AppState.MERCHANT_DASHBOARD:
        return (
          <MerchantDashboard
            inventory={merchantInventory}
            merchantProfile={merchantProfile}
            onUpdateInventory={setMerchantInventory}
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
