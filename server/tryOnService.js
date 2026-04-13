import { getAdminDb } from "./firebaseAdmin.js";
import { generateTryOnWithKie, uploadBase64FileToKie } from "./kie.js";

const COLLECTION_PRIVATE_PROFILE = "merchant_profiles";
const COLLECTION_GARMENTS = "garments";
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

const getGarmentById = async (garmentId) => {
  const db = getAdminDb();
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

const updateMerchantCredits = async (merchantUid, credits) => {
  await getAdminDb()
    .collection(COLLECTION_PRIVATE_PROFILE)
    .doc(merchantUid)
    .set({ credits }, { merge: true });
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

    if ((merchant.credits || 0) <= 0) {
      return {
        status: 402,
        body: {
          success: false,
          imageUrl: "",
          message: "Bu mağazanın deneme kredisi tükendi.",
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

      const remainingCredits = (merchant.credits || 0) - 1;
      await updateMerchantCredits(garment.merchantUid, remainingCredits);

      return {
        status: 200,
        body: {
          success: true,
          imageUrl: resultUrl,
          remainingCredits,
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
