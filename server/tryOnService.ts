import { getAdminAuth, getAdminDb, getAdminStorage } from "./firebaseAdmin";
import { generateTryOnWithKie } from "./kie";
import { CustomerProfile, DEFAULT_PROFILE, Garment, MerchantProfile, ProcessingResult } from "../types";

const COLLECTION_PRIVATE_PROFILE = "merchant_profiles";
const COLLECTION_CUSTOMER_PROFILE = "customer_profiles";
const COLLECTION_GARMENTS = "garments";
const COLLECTION_CUSTOMER_CREDIT_TRANSACTIONS = "credit_transactions";
const PRESET_CREDIT_COSTS = {
  economy: 1,
  balanced: 2,
  premium: 3,
} as const;

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Geçersiz görsel verisi.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "mirrorly";

const uploadTempImage = async ({
  dataUrl,
  path,
}: {
  dataUrl: string;
  path: string;
}) => {
  const bucket = getAdminStorage();
  const { buffer, contentType } = parseDataUrl(dataUrl);
  const file = bucket.file(path);

  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: "private, max-age=900",
    },
  });

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
  });

  return { file, signedUrl };
};

const getGarmentById = async (garmentId: string): Promise<Garment | null> => {
  const db = getAdminDb();
  const snapshots = await db.collectionGroup(COLLECTION_GARMENTS).get();
  const match = snapshots.docs.find((snapshot) => snapshot.id === garmentId);

  if (!match) return null;

  const garment = match.data() as Garment;
  return {
    ...garment,
    id: match.id,
    merchantUid: garment.merchantUid || match.ref.parent.parent?.id || "",
  };
};

const getMerchantPrivateProfile = async (merchantUid: string): Promise<MerchantProfile | null> => {
  const snapshot = await getAdminDb().collection(COLLECTION_PRIVATE_PROFILE).doc(merchantUid).get();
  if (!snapshot.exists) return null;

  return {
    ...DEFAULT_PROFILE,
    ...(snapshot.data() as Partial<MerchantProfile>),
    uid: merchantUid,
    role: "merchant",
  };
};

const getCustomerProfile = async (customerUid: string): Promise<CustomerProfile | null> => {
  const snapshot = await getAdminDb().collection(COLLECTION_CUSTOMER_PROFILE).doc(customerUid).get();
  if (!snapshot.exists) return null;

  return {
    ...(snapshot.data() as CustomerProfile),
    uid: customerUid,
    role: "customer",
  };
};

const updateMerchantCredits = async (merchantUid: string, credits: number) => {
  await getAdminDb()
    .collection(COLLECTION_PRIVATE_PROFILE)
    .doc(merchantUid)
    .set({ credits }, { merge: true });
};

const updateCustomerCredits = async (customerUid: string, credits: number) => {
  await getAdminDb()
    .collection(COLLECTION_CUSTOMER_PROFILE)
    .doc(customerUid)
    .set({ credits, updatedAt: Date.now() }, { merge: true });
};

const createCreditTransaction = async ({
  customerUid,
  credits,
  label,
  garmentId,
  balanceAfter,
}: {
  customerUid: string;
  credits: number;
  label: string;
  garmentId: string;
  balanceAfter: number;
}) => {
  const transactionRef = getAdminDb()
    .collection(COLLECTION_CUSTOMER_PROFILE)
    .doc(customerUid)
    .collection(COLLECTION_CUSTOMER_CREDIT_TRANSACTIONS)
    .doc();

  await transactionRef.set({
    id: transactionRef.id,
    type: "spend",
    credits: -Math.abs(credits),
    label,
    createdAt: Date.now(),
    balanceAfter,
    garmentId,
  });
};

const normalizeGarmentImage = async (garment: Garment) => {
  if (!garment.imageUrl.startsWith("data:")) {
    return { imageUrl: garment.imageUrl, cleanup: async () => {} };
  }

  const temp = await uploadTempImage({
    dataUrl: garment.imageUrl,
    path: `mirrorly-temp/garments/${garment.merchantUid}/${Date.now()}_${sanitizeFilename(garment.name)}.png`,
  });

  return {
    imageUrl: temp.signedUrl,
    cleanup: async () => {
      await temp.file.delete().catch(() => undefined);
    },
  };
};

export const handleTryOnRequest = async (payload: {
  garmentId?: string;
  userPhotoDataUrl?: string;
  customerUid?: string;
  customerAuthToken?: string;
}): Promise<{ status: number; body: ProcessingResult }> => {
  try {
    const garmentId = payload.garmentId?.trim();
    const userPhotoDataUrl = payload.userPhotoDataUrl?.trim();
    const requestedCustomerUid = payload.customerUid?.trim();
    const customerAuthToken = payload.customerAuthToken?.trim();

    if (!garmentId || !userPhotoDataUrl) {
      return {
        status: 400,
        body: {
          success: false,
          imageUrl: "",
          message: "Garment ID ve kullanıcı görseli zorunlu.",
        },
      };
    }

    let customerUid: string | undefined;
    if (requestedCustomerUid) {
      if (!customerAuthToken) {
        return {
          status: 401,
          body: {
            success: false,
            imageUrl: "",
            message: "Musteri oturumu dogrulanamadi. Lutfen tekrar giris yapin.",
          },
        };
      }

      try {
        const decodedToken = await getAdminAuth().verifyIdToken(customerAuthToken);
        if (decodedToken.uid !== requestedCustomerUid) {
          return {
            status: 403,
            body: {
              success: false,
              imageUrl: "",
              message: "Musteri oturumu eslesmedi. Lutfen tekrar giris yapin.",
            },
          };
        }

        customerUid = decodedToken.uid;
      } catch (error) {
        console.warn("Customer token verify failed:", error);
        return {
          status: 401,
          body: {
            success: false,
            imageUrl: "",
            message: "Musteri oturumu gecersiz. Lutfen tekrar giris yapin.",
          },
        };
      }
    }

    const garment = await getGarmentById(garmentId);
    if (!garment) {
      return {
        status: 404,
        body: {
          success: false,
          imageUrl: "",
          message: "İlgili ürün bulunamadı.",
        },
      };
    }

    let merchant = await getMerchantPrivateProfile(garment.merchantUid);
    if (!merchant && garment.merchantUid === 'demo-merchant') {
      merchant = {
        ...DEFAULT_PROFILE,
        ...DEFAULT_PROFILE,
        uid: 'demo-merchant',
        name: 'Demo Mağaza',
        credits: 9999,
        modelPreset: 'balanced'
      };
    }

    if (!merchant) {
      return {
        status: 404,
        body: {
          success: false,
          imageUrl: "",
          message: "Mağaza profili bulunamadı.",
        },
      };
    }
    let activeModelPreset = merchant.modelPreset || DEFAULT_PROFILE.modelPreset;
    let creditCost = PRESET_CREDIT_COSTS[activeModelPreset] || 1;
    let creditOwner: "merchant" | "customer" = "merchant";
    let customerProfile: CustomerProfile | null = null;
    let remainingCredits = merchant.credits - creditCost;

    if (customerUid) {
      customerProfile = await getCustomerProfile(customerUid);
      if (!customerProfile) {
        return {
          status: 404,
          body: {
            success: false,
            imageUrl: "",
            message: "Musteri bakiyesi bulunamadi. Lutfen tekrar giris yapin.",
          },
        };
      }

      activeModelPreset = customerProfile.modelPreset || activeModelPreset;
      creditCost = PRESET_CREDIT_COSTS[activeModelPreset] || 1;

      if ((customerProfile.credits || 0) < creditCost) {
        return {
          status: 402,
          body: {
            success: false,
            imageUrl: "",
            message: `Bu deneme icin ${creditCost} kredi gerekiyor. Bakiyeni yukleyip tekrar dene.`,
            creditOwner: "customer",
            remainingCredits: customerProfile.credits || 0,
            creditCost,
          },
        };
      }

      creditOwner = "customer";
      remainingCredits = (customerProfile.credits || 0) - creditCost;
    } else if (merchant.credits < creditCost) {
      return {
        status: 402,
        body: {
          success: false,
          imageUrl: "",
          message: `Bu magaza icin yeterli kredi yok. Bu deneme ${creditCost} kredi gerektiriyor.`,
          creditOwner: "merchant",
          remainingCredits: merchant.credits,
          creditCost,
        },
      };
    }

    const userTemp = await uploadTempImage({
      dataUrl: userPhotoDataUrl,
      path: `mirrorly-temp/try-on/${garment.merchantUid}/${Date.now()}_${sanitizeFilename(garmentId)}.png`,
    });
    const garmentTemp = await normalizeGarmentImage(garment);

    try {
      const resultUrl = await generateTryOnWithKie({
        garmentName: garment.name,
        garmentDescription: garment.description,
        garmentImageUrl: garmentTemp.imageUrl,
        preset: activeModelPreset,
        userImageUrl: userTemp.signedUrl,
      });

      if (creditOwner === "customer" && customerUid) {
        await updateCustomerCredits(customerUid, remainingCredits);
        await createCreditTransaction({
          customerUid,
          credits: creditCost,
          label: `${garment.name} denemesi`,
          garmentId: garment.id,
          balanceAfter: remainingCredits,
        });

        if (customerProfile?.email && remainingCredits <= 3 && (remainingCredits + creditCost) > 3) {
          const { sendLowCreditAlert } = await import("./emailService");
          await sendLowCreditAlert(customerProfile.email, remainingCredits).catch(e => console.error("Email error:", e));
        }

      } else {
        await updateMerchantCredits(garment.merchantUid, remainingCredits);
        
        if (merchant.email && remainingCredits <= 10 && (remainingCredits + creditCost) > 10) {
          const { sendLowCreditAlert } = await import("./emailService");
          await sendLowCreditAlert(merchant.email, remainingCredits).catch(e => console.error("Email error:", e));
        }
      }

      return {
        status: 200,
        body: {
          success: true,
          imageUrl: resultUrl,
          remainingCredits,
          creditOwner,
          creditCost,
        },
      };
    } finally {
      await Promise.all([
        userTemp.file.delete().catch((e) => console.warn("Temp user image delete failed", e)),
        garmentTemp.cleanup().catch((e) => console.warn("Temp garment image delete failed", e)),
      ]);
    }
  } catch (error: any) {
    console.error("Try-on API Error [Provider/Backend]:", error);
    return {
      status: 500,
      body: {
        success: false,
        imageUrl: "",
        message: error?.message || "Try-on işlemi sırasında bir hata oluştu.",
      },
    };
  }
};
