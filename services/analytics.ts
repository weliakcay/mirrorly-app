import mixpanel from 'mixpanel-browser';

// To be loaded from Vite env vars in production
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'YOUR_MIXPANEL_TOKEN_HERE';

let isInitialized = false;

export const initAnalytics = () => {
  if (isInitialized) return;
  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
      track_pageview: true,
      persistence: 'localStorage'
    });
    isInitialized = true;
    console.log('Mixpanel initialized');
  } catch (error) {
    console.warn('Mixpanel initialization failed:', error);
  }
};

export const identifyUser = (uid: string, traits?: Record<string, any>) => {
  if (!isInitialized) return;
  mixpanel.identify(uid);
  if (traits) {
    mixpanel.people.set(traits);
  }
};

export const trackEvent = (eventName: string, props?: Record<string, any>) => {
  if (!isInitialized) return;
  mixpanel.track(eventName, props);
};

export const trackTryOnStarted = (garmentId: string, merchantUid: string) => {
  trackEvent('TryOn_Started', { garmentId, merchantUid });
};

export const trackTryOnCompleted = (garmentId: string, success: boolean) => {
  trackEvent('TryOn_Completed', { garmentId, success });
};

export const trackSignup = (role: 'merchant' | 'customer', uid: string) => {
  trackEvent('User_Signup', { role });
  identifyUser(uid, { $created: new Date().toISOString(), role });
};
