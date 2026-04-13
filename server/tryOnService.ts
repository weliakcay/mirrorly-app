import { getAdminDb, getAdminStorage } from "./firebaseAdmin";
import { generateTryOnWithKie } from "./kie";
import { DEFAULT_PROFILE, Garment, MerchantProfile, ProcessingResult } from "../types";

const COLLECTION_PRIVATE_PROFILE = "merchant_profiles";
const COLLECTION_GARMENTS = "garments";

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

const updateMerchantCredits = async (merchantUid: string, credits: number) => {
  await getAdminDb()
    .collection(COLLECTION_PRIVATE_PROFILE)
    .doc(merchantUid)
    .set({ credits }, { merge: true });
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
}): Promise<{ status: number; body: ProcessingResult }> => {
  try {
    const garmentId = payload.garmentId?.trim();
    const userPhotoDataUrl = payload.userPhotoDataUrl?.trim();

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

    if (merchant.credits <= 0) {
      return {
        status: 402,
        body: {
          success: false,
          imageUrl: "",
          message: "Bu mağazanın deneme kredisi tükendi.",
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
        preset: merchant.modelPreset || DEFAULT_PROFILE.modelPreset,
        userImageUrl: userTemp.signedUrl,
      });

      const remainingCredits = merchant.credits - 1;
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
      await Promise.all([
        userTemp.file.delete().catch(() => undefined),
        garmentTemp.cleanup(),
      ]);
    }
  } catch (error: any) {
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
