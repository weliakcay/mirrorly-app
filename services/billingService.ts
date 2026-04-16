import { CustomerCreditPack, MerchantCreditPack } from "../types";

const LEMON_STORE_URL =
  import.meta.env.VITE_LS_STORE_URL || "https://mirrorly-tr.lemonsqueezy.com";

const buildVariantCheckoutUrl = (variantId?: string) =>
  variantId ? `${LEMON_STORE_URL.replace(/\/$/, "")}/checkout/buy/${variantId}` : undefined;

const CUSTOMER_VARIANT_IDS: Record<string, string | undefined> = {
  starter: import.meta.env.VITE_LS_CUSTOMER_STARTER_VARIANT_ID,
  standard: import.meta.env.VITE_LS_CUSTOMER_STANDARD_VARIANT_ID,
  plus: import.meta.env.VITE_LS_CUSTOMER_PLUS_VARIANT_ID,
};

const MERCHANT_VARIANT_IDS: Record<string, string | undefined> = {
  starter: import.meta.env.VITE_LS_MERCHANT_STARTER_VARIANT_ID,
  pro: import.meta.env.VITE_LS_MERCHANT_PRO_VARIANT_ID,
  scale: import.meta.env.VITE_LS_MERCHANT_SCALE_VARIANT_ID,
};

const CUSTOMER_CHECKOUT_URLS: Record<string, string | undefined> = {
  starter: buildVariantCheckoutUrl(CUSTOMER_VARIANT_IDS.starter),
  standard: buildVariantCheckoutUrl(CUSTOMER_VARIANT_IDS.standard),
  plus: buildVariantCheckoutUrl(CUSTOMER_VARIANT_IDS.plus),
};

const MERCHANT_CHECKOUT_URLS: Record<string, string | undefined> = {
  starter: buildVariantCheckoutUrl(MERCHANT_VARIANT_IDS.starter),
  pro: buildVariantCheckoutUrl(MERCHANT_VARIANT_IDS.pro),
  scale: buildVariantCheckoutUrl(MERCHANT_VARIANT_IDS.scale),
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
