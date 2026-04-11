import React, { useEffect, useState } from 'react';
import {
  AppState,
  CustomerProfile,
  DEFAULT_PROFILE,
  CatalogItem,
  FavoriteItem,
  Garment,
  HistoryItem,
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
import CustomerAuth from './components/CustomerAuth';
import CustomerAccount from './components/CustomerAccount';
import DiscoverFeed from './components/DiscoverFeed';
import FavoritesView from './components/FavoritesView';
import { generateTryOnImage } from './services/tryOnService';
import {
  addCustomerFavorite,
  clearCustomerHistoryItems,
  consumeGoogleRedirectCustomer,
  getCustomerFavorites,
  getCustomerHistoryItems,
  getCurrentCustomerProfile,
  getGarmentById,
  getGarmentsByMerchant,
  getPublicCatalog,
  getMerchantPublicProfileByUid,
  isFirebaseConfigured,
  logoutUser,
  removeCustomerFavorite,
  saveCustomerHistoryItem,
  signInCustomerWithGoogle,
} from './services/firebase';
import { clearHistory, getHistory, saveToHistory } from './services/historyService';

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
  const CUSTOMER_PROFILE_KEY = 'mirrorly_customer_profile';
  const [currentState, setCurrentState] = useState<AppState>(AppState.SPLASH);

  const [merchantInventory, setMerchantInventory] = useState<Garment[]>([]);
  const [collectionInventory, setCollectionInventory] = useState<Garment[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [discoverCatalog, setDiscoverCatalog] = useState<CatalogItem[]>([]);
  const [customerFavorites, setCustomerFavorites] = useState<FavoriteItem[]>([]);
  const [customerHistoryItems, setCustomerHistoryItems] = useState<HistoryItem[]>([]);
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

    const savedCustomer = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (savedCustomer) {
      try {
        setCustomerProfile(JSON.parse(savedCustomer));
      } catch {
        console.warn('Could not parse cached customer profile');
      }
    }
  }, []);

  useEffect(() => {
    const bootstrapCustomerAuth = async () => {
      if (!isFirebaseConfigured()) return;

      try {
        const redirectProfile = await consumeGoogleRedirectCustomer();
        if (redirectProfile) {
          setCustomerProfile(redirectProfile);
          localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(redirectProfile));
          const [favorites, history] = await Promise.all([
            getCustomerFavorites(redirectProfile.uid),
            getCustomerHistoryItems(redirectProfile.uid),
          ]);
          setCustomerFavorites(favorites);
          setCustomerHistoryItems(history);
          setCurrentState(AppState.CUSTOMER_ACCOUNT);
          return;
        }

        const existingCustomer = await getCurrentCustomerProfile();
        if (existingCustomer) {
          setCustomerProfile(existingCustomer);
          localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(existingCustomer));
          const [favorites, history] = await Promise.all([
            getCustomerFavorites(existingCustomer.uid),
            getCustomerHistoryItems(existingCustomer.uid),
          ]);
          setCustomerFavorites(favorites);
          setCustomerHistoryItems(history);
        }
      } catch (error) {
        console.warn('Customer auth bootstrap skipped:', error);
      }
    };

    bootstrapCustomerAuth();
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

  const handleCustomerLoginRequest = () => {
    setCurrentState(AppState.CUSTOMER_AUTH);
  };

  const handleGoogleCustomerSignIn = async () => {
    const profile = await signInCustomerWithGoogle();
    if (!profile) {
      return;
    }

    setCustomerProfile(profile);
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
    const [favorites, history] = await Promise.all([
      getCustomerFavorites(profile.uid),
      getCustomerHistoryItems(profile.uid),
    ]);
    setCustomerFavorites(favorites);
    setCustomerHistoryItems(history);
    setCurrentState(AppState.CUSTOMER_ACCOUNT);
  };

  const handleCustomerLogout = async () => {
    await logoutUser();
    setCustomerProfile(null);
    setCustomerFavorites([]);
    setCustomerHistoryItems([]);
    localStorage.removeItem(CUSTOMER_PROFILE_KEY);
    setCurrentState(AppState.LANDING);
  };

  const handleOpenDiscover = async () => {
    setIsLoadingData(true);

    try {
      if (!isFirebaseConfigured()) {
        setDiscoverCatalog([]);
        setCurrentState(AppState.DISCOVER);
        return;
      }

      const catalog = await getPublicCatalog();
      setDiscoverCatalog(catalog);
      setCurrentState(AppState.DISCOVER);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelectCatalogItem = async (item: CatalogItem) => {
    const nextUrl = `${window.location.pathname}?id=${encodeURIComponent(item.garment.id)}`;
    window.history.pushState({ path: nextUrl }, '', nextUrl);
    await loadGarmentExperience(item.garment.id);
  };

  const favoriteIds = new Set(customerFavorites.map((item) => item.garment.id));

  const buildCatalogItemFromSelection = (): CatalogItem | null => {
    if (!selectedGarment || !selectedMerchant) return null;
    return {
      garment: selectedGarment,
      merchant: selectedMerchant,
    };
  };

  const handleToggleFavorite = async (item: CatalogItem) => {
    if (!customerProfile) {
      setCurrentState(AppState.CUSTOMER_AUTH);
      return;
    }

    const alreadyFavorited = favoriteIds.has(item.garment.id);

    if (alreadyFavorited) {
      await removeCustomerFavorite(customerProfile.uid, item.garment.id);
      setCustomerFavorites((current) =>
        current.filter((favorite) => favorite.garment.id !== item.garment.id)
      );
      return;
    }

    const favorite = await addCustomerFavorite(customerProfile.uid, item);
    if (!favorite) return;

    setCustomerFavorites((current) => [favorite, ...current.filter((entry) => entry.id !== favorite.id)]);
  };

  const handleOpenHistory = async () => {
    if (!customerProfile || !isFirebaseConfigured()) {
      setCurrentState(AppState.CUSTOMER_HISTORY);
      return;
    }

    const items = await getCustomerHistoryItems(customerProfile.uid);
    setCustomerHistoryItems(items);
    setCurrentState(AppState.CUSTOMER_HISTORY);
  };

  const handleClearCloudHistory = async () => {
    if (!customerProfile) return;

    await clearCustomerHistoryItems(customerProfile.uid);
    setCustomerHistoryItems([]);
    clearHistory();
  };

  const handleOpenFavorites = async () => {
    if (!customerProfile) {
      setCurrentState(AppState.CUSTOMER_AUTH);
      return;
    }

    const items = await getCustomerFavorites(customerProfile.uid);
    setCustomerFavorites(items);
    setCurrentState(AppState.FAVORITES);
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
          const localHistory = getHistory();
          setCustomerHistoryItems(localHistory);

          if (customerProfile) {
            const savedCloudItem = await saveCustomerHistoryItem(
              customerProfile.uid,
              selectedGarment,
              apiResult.imageUrl
            );

            if (savedCloudItem) {
              setCustomerHistoryItems((current) => {
                const next = [savedCloudItem, ...current.filter((item) => item.id !== savedCloudItem.id)];
                return next.sort((a, b) => b.timestamp - a.timestamp);
              });
            }
          }

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
            onOpenHistory={handleOpenHistory}
            onCustomerLogin={handleCustomerLoginRequest}
          />
        );

      case AppState.CUSTOMER_HISTORY:
        return (
          <CustomerHistory
            onBack={() => setCurrentState(customerProfile ? AppState.CUSTOMER_ACCOUNT : AppState.LANDING)}
            onLogin={handleCustomerLoginRequest}
            items={customerProfile ? customerHistoryItems : undefined}
            isCloudMode={!!customerProfile}
            onClearCloud={handleClearCloudHistory}
          />
        );

      case AppState.CUSTOMER_AUTH:
        return (
          <CustomerAuth
            onBack={() => setCurrentState(AppState.LANDING)}
            onGoogleSignIn={handleGoogleCustomerSignIn}
          />
        );

      case AppState.CUSTOMER_ACCOUNT:
        return customerProfile ? (
          <CustomerAccount
            customerProfile={customerProfile}
            onBack={() => setCurrentState(AppState.LANDING)}
            onOpenDiscover={handleOpenDiscover}
            onOpenFavorites={handleOpenFavorites}
            onOpenHistory={handleOpenHistory}
            onLogout={handleCustomerLogout}
          />
        ) : (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={handleOpenHistory}
            onCustomerLogin={handleCustomerLoginRequest}
          />
        );

      case AppState.DISCOVER:
        return (
          <DiscoverFeed
            items={discoverCatalog}
            favoriteIds={favoriteIds}
            onBack={() => setCurrentState(AppState.CUSTOMER_ACCOUNT)}
            onSelectItem={handleSelectCatalogItem}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case AppState.FAVORITES:
        return (
          <FavoritesView
            items={customerFavorites}
            onBack={() => setCurrentState(AppState.CUSTOMER_ACCOUNT)}
            onSelectItem={(item) => handleSelectCatalogItem(item)}
            onRemove={(item) => handleToggleFavorite(item)}
          />
        );

      case AppState.GARMENT_VIEW:
        return selectedGarment ? (
          <GarmentView
            garment={selectedGarment}
            merchantProfile={selectedMerchant || buildFallbackMerchant(selectedGarment, merchantProfile)}
            inventory={collectionInventory}
            isFavorited={favoriteIds.has(selectedGarment.id)}
            onContinue={handleGarmentContinue}
            onMerchantClick={handleMerchantLoginRequest}
            onToggleFavorite={() => {
              const currentItem = buildCatalogItemFromSelection();
              if (currentItem) {
                void handleToggleFavorite(currentItem);
              }
            }}
            onSelectGarment={setSelectedGarment}
            onBack={() => setCurrentState(AppState.LANDING)}
          />
        ) : (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={handleOpenHistory}
            onCustomerLogin={handleCustomerLoginRequest}
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
