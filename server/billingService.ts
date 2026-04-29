import { getAdminDb } from "./firebaseAdmin";

export const addCreditsToMerchant = async (
  merchantUid: string,
  creditsToAdd: number,
  subscriptionTier?: 'starter' | 'pro' | 'scale' | 'none'
) => {
  const db = getAdminDb();
  const ref = db.collection("merchant_profiles").doc(merchantUid);
  
  await db.runTransaction(async (transaction) => {
    const defaultData = {
      credits: 0,
    };
    
    const doc = await transaction.get(ref);
    const currentData = doc.exists ? doc.data() : defaultData;
    
    const currentCredits = typeof currentData?.credits === 'number' ? currentData.credits : 0;
    const updatePayload: any = {
      credits: currentCredits + creditsToAdd,
    };

    if (subscriptionTier) {
      updatePayload.subscriptionTier = subscriptionTier;
    }

    transaction.set(ref, updatePayload, { merge: true });
  });

  return true;
};

export const addCreditsToCustomer = async (
  customerUid: string,
  creditsToAdd: number
) => {
  const db = getAdminDb();
  const ref = db.collection("customer_profiles").doc(customerUid);
  
  await db.runTransaction(async (transaction) => {
    const defaultData = {
      credits: 0,
    };
    
    const doc = await transaction.get(ref);
    const currentData = doc.exists ? doc.data() : defaultData;
    
    const currentCredits = typeof currentData?.credits === 'number' ? currentData.credits : 0;
    
    transaction.set(ref, { credits: currentCredits + creditsToAdd, updatedAt: Date.now() }, { merge: true });
  });

  return true;
};
