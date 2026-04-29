// Device detection utilities for debugging Google auth flows

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  browser: string;
  os: string;
}

export const detectDevice = (): DeviceInfo => {
  const ua = typeof window !== "undefined" ? window.navigator.userAgent : "";

  const isMobileMatch = /android|iphone|ipod|webos/i.test(ua);
  const isTabletMatch = /ipad|android(?!.*mobile)|tablet|playbook/i.test(ua);

  const isMobile = isMobileMatch && !isTabletMatch;
  const isTablet = isTabletMatch;
  const isDesktop = !isMobile && !isTablet;

  let browser = "Unknown";
  if (/chrome/i.test(ua) && !/chromium|edg/i.test(ua)) browser = "Chrome";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";

  return {
    isMobile,
    isTablet,
    isDesktop,
    userAgent: ua,
    browser,
    os,
  };
};

export const logDeviceInfo = () => {
  const device = detectDevice();
  console.log(
    "[Device Detection]",
    `${device.os} / ${device.browser}`,
    `Mobile: ${device.isMobile}, Tablet: ${device.isTablet}, Desktop: ${device.isDesktop}`
  );
  console.log("[Device UA]", device.userAgent);
  return device;
};

// Expected output on different devices:
// iPhone Safari: [Device Detection] iOS / Safari Mobile: true, Tablet: false, Desktop: false
// iPad Safari: [Device Detection] iOS / Safari Mobile: false, Tablet: true, Desktop: false
// Android Chrome: [Device Detection] Android / Chrome Mobile: true, Tablet: false, Desktop: false
// Android Tablet: [Device Detection] Android / Chrome Mobile: false, Tablet: true, Desktop: false
// Desktop Chrome: [Device Detection] Windows / Chrome Mobile: false, Tablet: false, Desktop: true
// Desktop Firefox: [Device Detection] Linux / Firefox Mobile: false, Tablet: false, Desktop: true
