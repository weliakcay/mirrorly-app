import crypto from 'crypto';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

const verifySignature = (rawBody, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (digest.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(digest, signatureBuffer);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const signature = req.headers['x-signature'];
    const rawBody = await readRawBody(req);

    if (!signature || !verifySignature(rawBody, signature, secret)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const { meta, data } = payload;
    const eventName = meta.event_name;
    const customData = meta.custom_data || {};
    const merchantUid = customData.merchant_uid;
    const customerUid = customData.customer_uid;
    // packageId ARTIK kredi kararinda KULLANILMAZ (client-kontrollu) — sadece log icin.
    const packageIdForLog = customData.package_id;

    if (!merchantUid && !customerUid) {
      console.warn("Webhook ignoring event without merchant_uid or customer_uid");
      return res.status(200).json({ message: 'Ignored: No target uid found' });
    }

    // Yalniz gercek odemeyi temsil eden event'ler kredi yukler. subscription_created/updated
    // KAPSAM DISI: yenileme/iptal/odeme-yontemi degisiminde tekrar tam kredi yuklemesin.
    const CREDIT_EVENTS = new Set(['order_created', 'subscription_payment_success']);
    if (!CREDIT_EVENTS.has(eventName)) {
      return res.status(200).json({ message: `Ignored event: ${eventName}` });
    }

    // Kredi miktari YALNIZ server-side variant_id -> kredi tablosundan belirlenir.
    // Variant ID'leri Vercel env'e girilmeli; eslesmezse kredi yuklenmez (fail-safe).
    const variantId = String(data?.attributes?.variant_id || "");
    const put = (map, envVal, value) => { const k = String(envVal || "").trim(); if (k) map[k] = value; };

    const CUSTOMER_VARIANTS = {};
    put(CUSTOMER_VARIANTS, process.env.VITE_LS_CUSTOMER_STARTER_VARIANT_ID, { credits: 12 });
    put(CUSTOMER_VARIANTS, process.env.VITE_LS_CUSTOMER_STANDARD_VARIANT_ID, { credits: 30 });
    put(CUSTOMER_VARIANTS, process.env.VITE_LS_CUSTOMER_PLUS_VARIANT_ID, { credits: 75 });

    const MERCHANT_VARIANTS = {};
    put(MERCHANT_VARIANTS, process.env.VITE_LS_MERCHANT_STARTER_VARIANT_ID || process.env.LS_STARTER_VARIANT_ID, { credits: 300, tier: 'starter' });
    put(MERCHANT_VARIANTS, process.env.VITE_LS_MERCHANT_PRO_VARIANT_ID || process.env.LS_PRO_VARIANT_ID, { credits: 1200, tier: 'pro' });
    put(MERCHANT_VARIANTS, process.env.VITE_LS_MERCHANT_SCALE_VARIANT_ID || process.env.LS_SCALE_VARIANT_ID, { credits: 5000, tier: 'scale' });
    put(MERCHANT_VARIANTS, process.env.LS_TOPUP_100_VARIANT_ID, { credits: 100 });

    const idempotencyKey = `${eventName}:${data?.id || variantId}`;
    const { addCreditsToMerchant, addCreditsToCustomer } = await import("../../server/billingService.js");

    if (customerUid) {
      const match = CUSTOMER_VARIANTS[variantId];
      if (!match) {
        console.warn(`Webhook: unmatched customer variant ${variantId} (pkg=${packageIdForLog}) — no credit granted`);
        return res.status(200).json({ message: 'Ignored: variant not mapped' });
      }
      const r = await addCreditsToCustomer(customerUid, match.credits, idempotencyKey);
      console.log(`Customer ${customerUid}: +${match.credits} (variant ${variantId}, ${r.alreadyProcessed ? 'DUP-skipped' : 'granted'})`);
    } else {
      const match = MERCHANT_VARIANTS[variantId];
      if (!match) {
        console.warn(`Webhook: unmatched merchant variant ${variantId} (pkg=${packageIdForLog}) — no credit granted`);
        return res.status(200).json({ message: 'Ignored: variant not mapped' });
      }
      const r = await addCreditsToMerchant(merchantUid, match.credits, match.tier, idempotencyKey);
      console.log(`Merchant ${merchantUid}: +${match.credits} tier=${match.tier || '-'} (variant ${variantId}, ${r.alreadyProcessed ? 'DUP-skipped' : 'granted'})`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('LemonSqueezy Webhook Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
