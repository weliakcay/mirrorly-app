import { CustomerCreditPack, MerchantCreditPack } from "../types";

const CUSTOMER_CHECKOUT_URLS: Record<string, string | undefined> = {
  starter:
    import.meta.env.VITE_LS_CUSTOMER_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/619b9b87-af4e-40d5-930c-d07ebe524c68?media=0",
  standard:
    import.meta.env.VITE_LS_CUSTOMER_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/619b9b87-af4e-40d5-930c-d07ebe524c68?media=0",
  plus:
    import.meta.env.VITE_LS_CUSTOMER_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/619b9b87-af4e-40d5-930c-d07ebe524c68?media=0",
};

const MERCHANT_CHECKOUT_URLS: Record<string, string | undefined> = {
  starter:
    import.meta.env.VITE_LS_MERCHANT_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/63edab1f-bf75-40f0-a538-6dd5458dced1",
  pro:
    import.meta.env.VITE_LS_MERCHANT_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/63edab1f-bf75-40f0-a538-6dd5458dced1",
  scale:
    import.meta.env.VITE_LS_MERCHANT_PRODUCT_CHECKOUT_URL ||
    "https://mirrorly-tr.lemonsqueezy.com/checkout/buy/63edab1f-bf75-40f0-a538-6dd5458dced1",
};

const appendCustomData = (rawUrl: string, customData: Record<string, string>) => {
  const url = new URL(rawUrl);

  Object.entries(customData).forEach(([key, value]) => {
    if (!value) return;
    url.searchParams.set(`checkout[custom][${key}]`, value);
  });

  return url.toString();
};

export const buildCustomerCheckoutUrl = (
  pack: CustomerCreditPack,
  customerUid: string
): string | null => {
  const rawUrl = CUSTOMER_CHECKOUT_URLS[pack.id] || pack.checkoutUrl;
  if (!rawUrl || !customerUid) return null;

  return appendCustomData(rawUrl, {
    customer_uid: customerUid,
    package_id: pack.id,
  });
};

export const buildMerchantCheckoutUrl = (
  pack: MerchantCreditPack,
  merchantUid: string
): string | null => {
  const rawUrl = MERCHANT_CHECKOUT_URLS[pack.packType] || pack.checkoutUrl;
  if (!rawUrl || !merchantUid) return null;

  return appendCustomData(rawUrl, {
    merchant_uid: merchantUid,
    package_id: pack.id,
    pack_type: pack.packType,
  });
};

export const openCustomerCheckout = (
  pack: CustomerCreditPack,
  customerUid: string
): boolean => {
  const url = buildCustomerCheckoutUrl(pack, customerUid);
  if (!url) return false;

  window.location.assign(url);
  return true;
};

export const openMerchantCheckout = (
  pack: MerchantCreditPack,
  merchantUid: string
): boolean => {
  const url = buildMerchantCheckoutUrl(pack, merchantUid);
  if (!url) return false;

  window.location.assign(url);
  return true;
};
