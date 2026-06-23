import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  AppState,
  CustomerProfile,
  DEFAULT_PROFILE,
  CatalogItem,
  CustomerCreditPack,
  FavoriteItem,
  Garment,
  HistoryItem,
  MerchantProfile,
  MerchantPublicProfile,
  ModelPreset,
  ProcessingResult,
} from './types';
import Splash from './components/Splash';
import Landing from './components/Landing';
import GarmentView from './components/GarmentView';
import PhotoInput from './components/PhotoInput';
import Processing from './components/Processing';
import ResultView from './components/ResultView';
import { generateTryOnImage } from './services/tryOnService';
import {
  addCustomerFavorite,
  clearGoogleRedirectPending,
  clearCustomerHistoryItems,
  consumeGoogleRedirectCustomer,
  getCustomerFavorites,
  getCurrentCustomerIdToken,
  getCustomerHistoryItems,
  getOrCreateCurrentCustomerProfile,
  getGarmentById,
  getGarmentsByMerchant,
  getPublicCatalog,
  getMerchantPublicProfileByUid,
  isFirebaseConfigured,
  isGoogleRedirectPending,
  loginUser,
  observeAuthSession,
  logoutUser,
  registerCustomer,
  removeCustomerFavorite,
  saveCustomerHistoryItem,
  signInCustomerWithGoogle,
  updateCustomerModelPreset,
} from './services/firebase';
import { clearHistory, getHistory, saveToHistory } from './services/historyService';
import { initAnalytics, identifyUser, trackTryOnStarted, trackTryOnCompleted } from './services/analytics';

const MerchantDashboard = lazy(() => import('./components/MerchantDashboard'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const CustomerHistory = lazy(() => import('./components/CustomerHistory'));
const CustomerAuth = lazy(() => import('./components/CustomerAuth'));
const CustomerAccount = lazy(() => import('./components/CustomerAccount'));
const CustomerCreditsView = lazy(() => import('./components/CustomerCreditsView'));
const DiscoverFeed = lazy(() => import('./components/DiscoverFeed'));
const FavoritesView = lazy(() => import('./components/FavoritesView'));

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
  const CUSTOMER_POST_AUTH_TARGET_KEY = 'mirrorly_customer_post_auth_target';
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const [currentState, setCurrentState] = useState<AppState>(AppState.SPLASH);
  const [isAdmin, setIsAdmin] = useState(false);
  const [experienceOriginState, setExperienceOriginState] = useState<AppState>(AppState.LANDING);

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
  const [isCustomerAuthPending, setIsCustomerAuthPending] = useState(false);
  const [customerCreditsNotice, setCustomerCreditsNotice] = useState('');
  const [customerCreditsBackState, setCustomerCreditsBackState] = useState<AppState>(
    AppState.CUSTOMER_ACCOUNT
  );

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
        const parsedCustomer = JSON.parse(savedCustomer);
        setCustomerProfile({
          ...parsedCustomer,
          credits: typeof parsedCustomer.credits === 'number' ? parsedCustomer.credits : 0,
        });
      } catch {
        console.warn('Could not parse cached customer profile');
      }
    }

    initAnalytics();
  }, []);

  const syncCustomerProfile = (profile: CustomerProfile | null) => {
    const normalizedProfile = profile
      ? {
          ...profile,
          credits: typeof profile.credits === 'number' ? profile.credits : 0,
        }
      : null;

    setCustomerProfile(normalizedProfile);

    if (normalizedProfile) {
      localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(normalizedProfile));
      return;
    }

    localStorage.removeItem(CUSTOMER_PROFILE_KEY);
  };

  const consumeCustomerPostAuthTarget = () => {
    const savedTarget = localStorage.getItem(CUSTOMER_POST_AUTH_TARGET_KEY);
    localStorage.removeItem(CUSTOMER_POST_AUTH_TARGET_KEY);

    if (savedTarget === AppState.DISCOVER) {
      return AppState.DISCOVER;
    }

    if (savedTarget === AppState.CUSTOMER_HISTORY) {
      return AppState.CUSTOMER_HISTORY;
    }

    if (savedTarget === AppState.FAVORITES) {
      return AppState.FAVORITES;
    }

    if (savedTarget === AppState.CUSTOMER_CREDITS) {
      return AppState.CUSTOMER_CREDITS;
    }

    return AppState.CUSTOMER_ACCOUNT;
  };

  const navigateCustomerAfterAuth = async (
    profile: CustomerProfile,
    target: AppState
  ) => {
    if (target === AppState.CUSTOMER_HISTORY) {
      const items = isFirebaseConfigured() ? await getCustomerHistoryItems(profile.uid) : getHistory();
      setCustomerHistoryItems(items);
      setCurrentState(AppState.CUSTOMER_HISTORY);
      return;
    }

    if (target === AppState.FAVORITES) {
      const items = isFirebaseConfigured() ? await getCustomerFavorites(profile.uid) : [];
      setCustomerFavorites(items);
      setCurrentState(AppState.FAVORITES);
      return;
    }

    if (target === AppState.DISCOVER) {
      await handleOpenDiscover();
      return;
    }

    if (target === AppState.CUSTOMER_CREDITS) {
      setCurrentState(AppState.CUSTOMER_CREDITS);
      return;
    }

    setCurrentState(AppState.CUSTOMER_ACCOUNT);
  };

  useEffect(() => {
    const bootstrapCustomerAuth = async () => {
      if (!isFirebaseConfigured()) return;

      const syncCustomerCollections = async (uid: string) => {
        try {
          const [favorites, history] = await Promise.all([
            getCustomerFavorites(uid),
            getCustomerHistoryItems(uid),
          ]);
          setCustomerFavorites(favorites);
          setCustomerHistoryItems(history);
        } catch (error) {
          console.warn('Customer collection sync skipped:', error);
        }
      };

      const applyCustomerSession = async (
        profile: CustomerProfile,
        target: AppState | null = null
      ) => {
        console.log('[Bootstrap] Applying customer session for:', profile.email);
        clearGoogleRedirectPending();
        setIsCustomerAuthPending(false);
        syncCustomerProfile(profile);
        identifyUser(profile.uid, { role: 'customer' });
        await syncCustomerCollections(profile.uid);

        if (target) {
          console.log('[Bootstrap] Navigating to target:', target);
          await navigateCustomerAfterAuth(profile, target);
        }
      };

      const waitForRedirectSession = async (target: AppState | null) => {
        // İlk olarak consumeGoogleRedirectCustomer'ı tekrar dene (gecikmiş result)
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const profile = await consumeGoogleRedirectCustomer();
            if (profile) {
              await applyCustomerSession(profile, target);
              return true;
            }
          } catch (error) {
            console.warn('Consume redirect attempt', attempt + 1, 'skipped:', error);
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Ardından getOrCreateCurrentCustomerProfile'ı dene
        for (let attempt = 0; attempt < 20; attempt += 1) {
          try {
            const profile = await getOrCreateCurrentCustomerProfile();
            if (profile) {
              await applyCustomerSession(profile, target);
              return true;
            }
          } catch (error) {
            console.warn('Redirect session poll attempt', attempt + 1, 'skipped:', error);
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        console.warn('Redirect session timed out after 25 total attempts');
        return false;
      };

      let unsubscribe = () => {};
      const redirectPending = isGoogleRedirectPending();
      console.log('[Bootstrap] Redirect pending:', redirectPending);
      if (redirectPending) {
        console.log('[Bootstrap] Setting auth pending');
        setIsCustomerAuthPending(true);
      }

      try {
        console.log('[Bootstrap] Consuming redirect customer...');
        const redirectProfile = await consumeGoogleRedirectCustomer();
        if (redirectProfile) {
          console.log('[Bootstrap] Got redirect profile, applying session');
          await applyCustomerSession(redirectProfile, consumeCustomerPostAuthTarget());
          return;
        }

        if (redirectPending) {
          console.log('[Bootstrap] Redirect pending, waiting for session...');
          const pendingTarget = localStorage.getItem(CUSTOMER_POST_AUTH_TARGET_KEY);
          const resolved = await waitForRedirectSession(
            pendingTarget ? consumeCustomerPostAuthTarget() : AppState.DISCOVER
          );

          if (resolved) {
            return;
          }

          console.warn('Redirect pending but session not found, clearing pending flag');
          clearGoogleRedirectPending();
        }

        const existingCustomer = await getOrCreateCurrentCustomerProfile();
        if (existingCustomer) {
          const pendingTarget = localStorage.getItem(CUSTOMER_POST_AUTH_TARGET_KEY);
          await applyCustomerSession(
            existingCustomer,
            pendingTarget ? consumeCustomerPostAuthTarget() : null
          );
          return;
        }

        setIsCustomerAuthPending(false);
      } catch (error) {
        console.warn('Customer auth bootstrap skipped:', error);
      }

      unsubscribe = observeAuthSession(async (user) => {
        if (!user) return;

        try {
          const profile = await getOrCreateCurrentCustomerProfile();
          if (!profile) return;

          const pendingTarget = localStorage.getItem(CUSTOMER_POST_AUTH_TARGET_KEY);
          await applyCustomerSession(profile, pendingTarget ? consumeCustomerPostAuthTarget() : null);
        } catch (error) {
          console.warn('Customer auth observer skipped:', error);
        }
      });

      return unsubscribe;
    };

    let cleanup = () => {};

    void bootstrapCustomerAuth().then((unsubscribe) => {
      if (unsubscribe) {
        cleanup = unsubscribe;
      }
    });

    return () => {
      cleanup();
    };
  }, []);

  const resetExperienceState = () => {
    setResult(null);
    setUserPhoto(null);
    setSelectedGarment(null);
    setSelectedMerchant(null);
    setCollectionInventory([]);
  };

  const goToLanding = () => {
    resetExperienceState();
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    setCurrentState(AppState.LANDING);
  };

  const returnFromGarmentView = () => {
    if (experienceOriginState === AppState.DISCOVER || experienceOriginState === AppState.FAVORITES) {
      setCurrentState(experienceOriginState);
      return;
    }

    goToLanding();
  };

  const loadGarmentExperience = async (
    garmentId: string,
    originState: AppState = AppState.LANDING
  ) => {
    setIsLoadingData(true);
    setExperienceOriginState(originState);

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
      await loadGarmentExperience(garmentId, AppState.LANDING);
      return;
    }

    setCurrentState(AppState.LANDING);
  };

  const handleGarmentContinue = () => {
    if (customerProfile && customerProfile.credits <= 0) {
      setCustomerCreditsNotice('Bu urunu denemek icin kredi yuklemen gerekiyor.');
      setCustomerCreditsBackState(AppState.GARMENT_VIEW);
      setCurrentState(AppState.CUSTOMER_CREDITS);
      return;
    }

    if (selectedGarment) {
      trackTryOnStarted(selectedGarment.id, selectedGarment.merchantUid);
    }
    setCurrentState(AppState.PHOTO_INPUT);
  };

  const handleMerchantLoginRequest = () => {
    setCurrentState(AppState.MERCHANT_DASHBOARD);
  };

  const handleCustomerLoginRequest = async (target: AppState = AppState.DISCOVER) => {
    if (customerProfile) {
      await navigateCustomerAfterAuth(customerProfile, target);
      return;
    }

    localStorage.setItem(CUSTOMER_POST_AUTH_TARGET_KEY, target);
    setCurrentState(AppState.CUSTOMER_AUTH);
  };

  const handleGoogleCustomerSignIn = async () => {
    console.log('[SignIn] Google sign-in clicked');
    setIsCustomerAuthPending(true);
    try {
      const profile = await signInCustomerWithGoogle();
      if (!profile) {
        console.log('[SignIn] No profile returned (redirect flow initiated)');
        return;
      }

      console.log('[SignIn] Got profile:', profile.email);
      // Check if user is admin
      if (adminEmails.includes(profile.email)) {
        console.log('[SignIn] User is admin, routing to ADMIN_PANEL');
        setIsAdmin(true);
        setCurrentState(AppState.ADMIN_PANEL);
        setIsCustomerAuthPending(false);
        return;
      }

      console.log('[SignIn] Regular customer, syncing data...');
      syncCustomerProfile(profile);
      const [favorites, history] = await Promise.all([
        getCustomerFavorites(profile.uid),
        getCustomerHistoryItems(profile.uid),
      ]);
      setCustomerFavorites(favorites);
      setCustomerHistoryItems(history);
      console.log('[SignIn] Data synced, navigating...');
      await navigateCustomerAfterAuth(profile, consumeCustomerPostAuthTarget());
      console.log('[SignIn] Navigation complete');
      setIsCustomerAuthPending(false);
    } catch (error) {
      console.error('[SignIn] Google sign-in error:', error);
      setIsCustomerAuthPending(false);
    }
  };

  const handleEmailCustomerSignIn = async (email: string, password: string, isRegister: boolean) => {
    setIsCustomerAuthPending(true);
    try {
      let profile: CustomerProfile | null = null;

      if (isRegister) {
        profile = await registerCustomer(email, password);
      } else {
        const result = await loginUser(email, password);
        if (result && result.role === 'customer' && result.profile) {
          profile = result.profile as CustomerProfile;
        } else if (result && result.role !== 'customer') {
          setIsCustomerAuthPending(false);
          throw new Error('Bu hesap bir mağaza hesabıdır. Lütfen müşteri hesabı kullanın.');
        }
      }

      if (!profile) {
        setIsCustomerAuthPending(false);
        throw new Error('Profil oluşturulamadı. Lütfen tekrar deneyin.');
      }

      // Check if user is admin
      if (adminEmails.includes(email)) {
        setIsAdmin(true);
        setCurrentState(AppState.ADMIN_PANEL);
        setIsCustomerAuthPending(false);
        return;
      }

      console.log('[SignIn] Email auth succeeded for:', profile.email);
      syncCustomerProfile(profile);
      const [favorites, history] = await Promise.all([
        getCustomerFavorites(profile.uid),
        getCustomerHistoryItems(profile.uid),
      ]);
      setCustomerFavorites(favorites);
      setCustomerHistoryItems(history);
      console.log('[SignIn] Data synced, navigating...');
      await navigateCustomerAfterAuth(profile, consumeCustomerPostAuthTarget());
      console.log('[SignIn] Navigation complete');
      setIsCustomerAuthPending(false);
    } catch (error: any) {
      console.error('Email sign-in failed:', error);
      setIsCustomerAuthPending(false);
      throw error;
    }
  };

  const handleCustomerLogout = async () => {
    await logoutUser();
    syncCustomerProfile(null);
    setCustomerFavorites([]);
    setCustomerHistoryItems([]);
    setCurrentState(AppState.LANDING);
  };

  const handleOpenCustomerCredits = async (origin: AppState = AppState.CUSTOMER_ACCOUNT) => {
    if (!customerProfile) {
      localStorage.setItem(CUSTOMER_POST_AUTH_TARGET_KEY, AppState.CUSTOMER_CREDITS);
      setCurrentState(AppState.CUSTOMER_AUTH);
      return;
    }

    setCustomerCreditsBackState(origin);
    if (origin !== AppState.GARMENT_VIEW) {
      setCustomerCreditsNotice('');
    }
    setCurrentState(AppState.CUSTOMER_CREDITS);
  };

  const handleAddCustomerCredits = async (pack: CustomerCreditPack) => {
    console.warn('Customer checkout unavailable for pack:', pack.id);
    setCustomerCreditsNotice(
      'Odeme sayfasi su an acilamadi. Lutfen birazdan tekrar dene.'
    );
  };

  const handleSelectCustomerModelPreset = async (preset: ModelPreset) => {
    if (!customerProfile) return;

    try {
      const updatedProfile = await updateCustomerModelPreset(customerProfile.uid, preset);
      if (updatedProfile) {
        syncCustomerProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to update customer model preset:', error);
    }
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
    await loadGarmentExperience(item.garment.id, currentState);
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
        try {
          const base64String = reader.result as string;
          const apiResult = await generateTryOnImage(
            base64String,
            selectedGarment.id,
            selectedGarment.imageUrl,
            selectedGarment.name,
            customerProfile?.uid,
            customerProfile ? await getCurrentCustomerIdToken() : undefined
          );

          setResult(apiResult);
          setCurrentState(AppState.RESULT);

          if (selectedGarment) {
            trackTryOnCompleted(selectedGarment.id, apiResult.success);
          }

          if (!apiResult.success || !apiResult.imageUrl) {
            return;
          }

          try {
            saveToHistory(selectedGarment, apiResult.imageUrl);
            setCustomerHistoryItems(getHistory());
          } catch (historyError) {
            console.warn('Local history save skipped:', historyError);
          }

          if (customerProfile) {
            void saveCustomerHistoryItem(customerProfile.uid, selectedGarment, apiResult.imageUrl)
              .then((savedCloudItem) => {
                if (!savedCloudItem) return;

                setCustomerHistoryItems((current) => {
                  const next = [
                    savedCloudItem,
                    ...current.filter((item) => item.id !== savedCloudItem.id),
                  ];
                  return next.sort((a, b) => b.timestamp - a.timestamp);
                });
              })
              .catch((cloudError) => {
                console.warn('Cloud history save skipped:', cloudError);
              });
          }

          if (typeof apiResult.remainingCredits === 'number') {
            if (
              apiResult.creditOwner === 'customer' &&
              customerProfile
            ) {
              syncCustomerProfile({
                ...customerProfile,
                credits: apiResult.remainingCredits,
              });
            }

            if (
              apiResult.creditOwner !== 'customer' &&
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
        } catch (error) {
          console.error('Try-on result handling error:', error);
          setResult({
            success: false,
            imageUrl: '',
            message: 'Gorsel hazirlandi ancak son adimda bir sorun olustu. Lutfen tekrar deneyin.',
          });
          setCurrentState(AppState.RESULT);
        }
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
    goToLanding();
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
            onCustomerLogin={() => {
              void handleCustomerLoginRequest(AppState.DISCOVER);
            }}
            isCustomerLoggedIn={!!customerProfile}
            customerProfile={customerProfile}
            onCustomerAccount={() => setCurrentState(AppState.CUSTOMER_ACCOUNT)}
          />
        );

      case AppState.CUSTOMER_HISTORY:
        return (
          <CustomerHistory
            onBack={() => setCurrentState(customerProfile ? AppState.CUSTOMER_ACCOUNT : AppState.LANDING)}
            onLogin={() => {
              void handleCustomerLoginRequest(AppState.CUSTOMER_HISTORY);
            }}
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
            onEmailSignIn={handleEmailCustomerSignIn}
            isPending={isCustomerAuthPending}
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
            onOpenCredits={() => {
              void handleOpenCustomerCredits(AppState.CUSTOMER_ACCOUNT);
            }}
            onLogout={handleCustomerLogout}
          />
        ) : (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={handleOpenHistory}
            onCustomerLogin={() => {
              void handleCustomerLoginRequest(AppState.DISCOVER);
            }}
            isCustomerLoggedIn={!!customerProfile}
            customerProfile={customerProfile}
            onCustomerAccount={() => setCurrentState(AppState.CUSTOMER_ACCOUNT)}
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

      case AppState.CUSTOMER_CREDITS:
        return customerProfile ? (
          <CustomerCreditsView
            customerProfile={customerProfile}
            notice={customerCreditsNotice}
            onBack={() => setCurrentState(customerCreditsBackState)}
            onAddCredits={handleAddCustomerCredits}
            onSelectModelPreset={handleSelectCustomerModelPreset}
          />
        ) : (
          <CustomerAuth
            onBack={() => setCurrentState(AppState.LANDING)}
            onGoogleSignIn={handleGoogleCustomerSignIn}
            isPending={isCustomerAuthPending}
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
            customerCredits={customerProfile?.credits || 0}
            onCustomerAccess={() => {
              void handleCustomerLoginRequest(AppState.DISCOVER);
            }}
            onOpenCredits={() => {
              void handleOpenCustomerCredits(AppState.GARMENT_VIEW);
            }}
            isCustomerLoggedIn={!!customerProfile}
            onToggleFavorite={() => {
              const currentItem = buildCatalogItemFromSelection();
              if (currentItem) {
                void handleToggleFavorite(currentItem);
              }
            }}
            onSelectGarment={setSelectedGarment}
            onBack={returnFromGarmentView}
            onHome={goToLanding}
          />
        ) : (
          <Landing
            onMerchantLogin={handleMerchantLoginRequest}
            onOpenHistory={handleOpenHistory}
            onCustomerLogin={() => {
              void handleCustomerLoginRequest(AppState.DISCOVER);
            }}
            isCustomerLoggedIn={!!customerProfile}
            customerProfile={customerProfile}
            onCustomerAccount={() => setCurrentState(AppState.CUSTOMER_ACCOUNT)}
          />
        );

      case AppState.PHOTO_INPUT:
        return (
          <PhotoInput
            onPhotoSelected={handlePhotoSelected}
            onBack={() => setCurrentState(AppState.GARMENT_VIEW)}
            onHome={goToLanding}
          />
        );

      case AppState.PROCESSING:
        return <Processing onCancel={handleCancelProcessing} onBack={handleCancelProcessing} onHome={goToLanding} />;

      case AppState.RESULT:
        return result && selectedGarment ? (
          <ResultView
            result={result}
            garment={selectedGarment}
            merchantProfile={
              selectedMerchant || buildFallbackMerchant(selectedGarment, merchantProfile)
            }
            onRetake={handleRetake}
            onHome={goToLanding}
          />
        ) : null;

      case AppState.MERCHANT_DASHBOARD:
        return (
          <MerchantDashboard
            inventory={merchantInventory}
            merchantProfile={merchantProfile}
            onUpdateInventory={setMerchantInventory}
            onUpdateProfile={setMerchantProfile}
            onCustomerLogin={() => {
              void handleCustomerLoginRequest(AppState.DISCOVER);
            }}
            onBack={() => {
              setCurrentState(AppState.LANDING);
            }}
          />
        );

      case AppState.ADMIN_PANEL:
        return (
          <AdminPanel
            userEmail={customerProfile?.email || ''}
            onBack={() => {
              setIsAdmin(false);
              setCurrentState(AppState.LANDING);
            }}
            onLogout={async () => {
              await handleCustomerLogout();
              setIsAdmin(false);
            }}
          />
        );

      default:
        return null;
    }
  };

  const isMerchantScreen = currentState === AppState.MERCHANT_DASHBOARD;
  const isAdminScreen = currentState === AppState.ADMIN_PANEL;

  return (
    <div className="w-full min-h-[100dvh] bg-neutral-100 flex items-stretch justify-center overflow-x-hidden">
      {isAdminScreen ? (
        <div className="w-full min-h-[100dvh] bg-slate-50 relative overflow-hidden">
          <Suspense fallback={<Processing />}>{renderContent()}</Suspense>
        </div>
      ) : isMerchantScreen ? (
        <div className="w-full min-h-[100dvh] bg-boutique-cream relative overflow-hidden">
          <Suspense fallback={<Processing />}>{renderContent()}</Suspense>
        </div>
      ) : (
        <div className="w-full min-h-[100dvh] bg-boutique-cream relative overflow-hidden sm:min-h-0 sm:max-w-md sm:h-[calc(100dvh-2rem)] sm:max-h-[900px] sm:my-4 sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-200">
          <Suspense fallback={<Processing />}>{renderContent()}</Suspense>
        </div>
      )}
    </div>
  );
};

export default App;
