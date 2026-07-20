import { getAdminAuth, getAdminDb } from "./firebaseAdmin.js";
import { generateTryOnWithKie, uploadBase64FileToKie } from "./kie.js";

const COLLECTION_PRIVATE_PROFILE = "merchant_profiles";
const COLLECTION_CUSTOMER_PROFILE = "customer_profiles";
const COLLECTION_GARMENTS = "garments";
const COLLECTION_CUSTOMER_CREDIT_TRANSACTIONS = "credit_transactions";
const DEFAULT_MODEL_PRESET = "balanced";

const sanitizeFilename = (value) =>
  value.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "mirrorly";

const uploadDataUrlToKie = async ({ dataUrl, uploadPath, fileName }) => {
  return uploadBase64FileToKie({
    base64Data: dataUrl,
    uploadPath,
    fileName,
  });
};

const getGarmentById = async (garmentId, merchantUid) => {
  const db = getAdminDb();

  // Hizli yol: merchantUid (client'tan hint) varsa dogrudan doc get — collectionGroup
  // taramasi yok. merchantUid dogrulanmaz; sadece lookup hint'i, kredi hep garment
  // dokumanindaki merchantUid'den dusulur. Yanlis/eksikse asagidaki taramaya duser.
  if (merchantUid) {
    const directSnap = await db
      .collection(COLLECTION_PRIVATE_PROFILE)
      .doc(merchantUid)
      .collection(COLLECTION_GARMENTS)
      .doc(garmentId)
      .get();
    if (directSnap.exists) {
      const garment = directSnap.data();
      return { ...garment, id: directSnap.id, merchantUid: garment.merchantUid || merchantUid };
    }
  }

  const snapshots = await db.collectionGroup(COLLECTION_GARMENTS).get();
  const match = snapshots.docs.find((snapshot) => snapshot.id === garmentId);

  if (!match) return null;

  const garment = match.data();
  return {
    ...garment,
    id: match.id,
    merchantUid: garment.merchantUid || match.ref.parent.parent?.id || "",
  };
};

const getMerchantPrivateProfile = async (merchantUid) => {
  const snapshot = await getAdminDb().collection(COLLECTION_PRIVATE_PROFILE).doc(merchantUid).get();
  if (!snapshot.exists) return null;

  return {
    ...snapshot.data(),
    uid: merchantUid,
    role: "merchant",
  };
};

const getCustomerProfile = async (customerUid) => {
  const snapshot = await getAdminDb().collection(COLLECTION_CUSTOMER_PROFILE).doc(customerUid).get();
  if (!snapshot.exists) return null;

  return {
    ...snapshot.data(),
    uid: customerUid,
    role: "customer",
  };
};

// Atomik kredi dusumu + merchant audit log. Transaction re-read ile lost-update
// (paralel try-on) onlenir; bakiye asla negatif olmaz.
const deductMerchantCreditAtomic = async (merchantUid, creditCost, garmentId) => {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION_PRIVATE_PROFILE).doc(merchantUid);
  const txnRef = ref.collection(COLLECTION_CUSTOMER_CREDIT_TRANSACTIONS).doc();
  return db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const current = snap.exists && typeof snap.data()?.credits === "number" ? snap.data().credits : 0;
    const newBalance = Math.max(0, current - creditCost);
    t.set(ref, { credits: newBalance, updatedAt: Date.now() }, { merge: true });
    t.set(txnRef, {
      id: txnRef.id,
      type: "spend",
      credits: -creditCost,
      label: "Try-on denemesi",
      createdAt: Date.now(),
      balanceAfter: newBalance,
      ...(garmentId ? { garmentId } : {}),
    });
    return newBalance;
  });
};

const updateCustomerCredits = async (customerUid, credits) => {
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

const normalizeGarmentImage = async (garment) => {
  if (!garment.imageUrl.startsWith("data:")) {
    return { imageUrl: garment.imageUrl, cleanup: async () => {} };
  }

  const imageUrl = await uploadDataUrlToKie({
    dataUrl: garment.imageUrl,
    uploadPath: `mirrorly-temp/garments/${garment.merchantUid}`,
    fileName: `${Date.now()}_${sanitizeFilename(garment.name)}.png`,
  });

  return {
    imageUrl,
    cleanup: async () => {},
  };
};

export const handleTryOnRequest = async (payload) => {
  try {
    const garmentId = payload?.garmentId?.trim();
    const userPhotoDataUrl = payload?.userPhotoDataUrl?.trim();
    const requestedCustomerUid = payload?.customerUid?.trim();
    const customerAuthToken = payload?.customerAuthToken?.trim();
    const requestedMerchantUid = payload?.merchantUid?.trim();

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

    // Server-authoritative dogrulama: customerUid'e guvenmeden once Firebase
    // ID token'i ile sahibini dogrula. Anonim (guest) try-on'da bu adim atlanir.
    let customerUid;
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

    const garment = await getGarmentById(garmentId, requestedMerchantUid);
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

    const merchant = await getMerchantPrivateProfile(garment.merchantUid);
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

    // QR ile gelen deneme = magaza pazarlama butcesinden dusulur. Customer kredisi
    // su an pasif (ileride self-upload/remix icin). Customer profili sadece
    // identify amaciyla cekilir, krediden dusulmez.
    // Tek model stratejisi: tum preset'ler ayni flux-2 ciktisini uretir, bu yuzden
    // deneme basi sabit 1 kredi (eski 1/2/3 preset ucreti adaletsizdi).
    const creditCost = 1;
    const creditOwner = "merchant";
    let customerProfile = null;

    if (customerUid) {
      customerProfile = await getCustomerProfile(customerUid);
    }

    if ((merchant.credits || 0) < creditCost) {
      return {
        status: 402,
        body: {
          success: false,
          imageUrl: "",
          message: `Bu magazanin yeterli kredisi yok. Magaza yetkilisi krediyi yuklediginde tekrar deneyebilirsin.`,
          creditOwner: "merchant",
          remainingCredits: merchant.credits || 0,
          creditCost,
        },
      };
    }

    const userImageUrl = await uploadDataUrlToKie({
      dataUrl: userPhotoDataUrl,
      uploadPath: `mirrorly-temp/try-on/${garment.merchantUid}`,
      fileName: `${Date.now()}_${sanitizeFilename(garmentId)}.png`,
    });
    const garmentTemp = await normalizeGarmentImage(garment);

    try {
      const resultUrl = await generateTryOnWithKie({
        garmentName: garment.name,
        garmentDescription: garment.description,
        garmentImageUrl: garmentTemp.imageUrl,
        preset: merchant.modelPreset || DEFAULT_MODEL_PRESET,
        userImageUrl,
      });

      // QR-attributed try-on: krediyi atomik olarak magazadan dus + audit log.
      const remainingCredits = await deductMerchantCreditAtomic(garment.merchantUid, creditCost, garmentId);

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
      await garmentTemp.cleanup();
    }
  } catch (error) {
    console.error("Try-on API Error:", error);
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
