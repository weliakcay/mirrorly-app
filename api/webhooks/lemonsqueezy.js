import crypto from 'crypto';
import { getAdminDb } from '../../server/firebaseAdmin.js';

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
    const eventFingerprint = crypto.createHash('sha256').update(rawBody).digest('hex');
    const eventRef = getAdminDb().collection('billing_webhook_events').doc(eventFingerprint);
    const existingEvent = await eventRef.get();

    if (existingEvent.exists) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    const { meta, data } = payload;
    const eventName = meta.event_name;
    const customData = meta.custom_data || {};
    const merchantUid = customData.merchant_uid;
    const customerUid = customData.customer_uid;
    const packageId = customData.package_id;

    if (!merchantUid && !customerUid) {
      console.warn("Webhook ignoring event without merchant_uid or customer_uid");
      return res.status(200).json({ message: 'Ignored: No target uid found' });
    }

    if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const { addCreditsToMerchant, addCreditsToCustomer } = await import("../../server/billingService.js");
      
      const variantId = String(data.attributes.variant_id);
      const customerStarterVariantId = String(process.env.VITE_LS_CUSTOMER_STARTER_VARIANT_ID || "");
      const customerStandardVariantId = String(process.env.VITE_LS_CUSTOMER_STANDARD_VARIANT_ID || "");
      const customerPlusVariantId = String(process.env.VITE_LS_CUSTOMER_PLUS_VARIANT_ID || "");
      const merchantStarterVariantId =
        String(process.env.VITE_LS_MERCHANT_STARTER_VARIANT_ID || process.env.LS_STARTER_VARIANT_ID || "");
      const merchantProVariantId =
        String(process.env.VITE_LS_MERCHANT_PRO_VARIANT_ID || process.env.LS_PRO_VARIANT_ID || "");
      const merchantScaleVariantId =
        String(process.env.VITE_LS_MERCHANT_SCALE_VARIANT_ID || process.env.LS_SCALE_VARIANT_ID || "");
      let creditsToAdd = 0;
      let newTier = undefined;

      if (customerUid) {
        if (variantId === customerStarterVariantId || packageId === 'starter') creditsToAdd = 12;
        else if (variantId === customerStandardVariantId || packageId === 'standard') creditsToAdd = 30;
        else if (variantId === customerPlusVariantId || packageId === 'plus') creditsToAdd = 75;
        
        if (creditsToAdd > 0) {
          await addCreditsToCustomer(customerUid, creditsToAdd);
          console.log(`Granted ${creditsToAdd} customer credits to ${customerUid}`);
        }
      } else if (merchantUid) {
        if (packageId === 'merchant_starter' || variantId === merchantStarterVariantId) {
          creditsToAdd = 300;
          newTier = 'starter';
        } else if (packageId === 'merchant_pro' || variantId === merchantProVariantId) {
          creditsToAdd = 1200;
          newTier = 'pro';
        } else if (packageId === 'merchant_scale' || variantId === merchantScaleVariantId) {
          creditsToAdd = 5000;
          newTier = 'scale';
        } else if (variantId === process.env.LS_TOPUP_100_VARIANT_ID) {
          creditsToAdd = 100;
        }

        if (creditsToAdd > 0) {
          await addCreditsToMerchant(merchantUid, creditsToAdd, newTier);
          console.log(`Granted ${creditsToAdd} merchant credits to ${merchantUid}`);
        }
      }
    }

    await eventRef.set({
      id: eventFingerprint,
      eventName,
      processedAt: Date.now(),
      customerUid: customerUid || null,
      merchantUid: merchantUid || null,
      packageId: packageId || null,
      variantId: data?.attributes?.variant_id || null,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('LemonSqueezy Webhook Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
