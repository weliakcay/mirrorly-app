import { ProcessingResult } from "../types";

const resizeImage = (base64Str: string, maxWidth = 960): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      } else if (height > maxWidth) {
        width *= maxWidth / height;
        height = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    img.onerror = () => resolve(base64Str);
  });
};

export const generateTryOnImage = async (
  userPhotoBase64: string,
  garmentId: string
): Promise<ProcessingResult> => {
  try {
    const optimizedPhoto = await resizeImage(userPhotoBase64);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 95_000);

    const response = await fetch("/api/try-on", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        garmentId,
        userPhotoDataUrl: optimizedPhoto,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let payload: any = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }
    if (!payload) {
      return {
        success: false,
        imageUrl: "",
        message: rawText || "Sunucudan geçerli bir yanıt alınamadı.",
      };
    }

    if (!response.ok || payload.success === false) {
      return {
        success: false,
        imageUrl: "",
        message: payload.message || "Try-on işlemi tamamlanamadı.",
      };
    }

    return payload as ProcessingResult;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return {
        success: false,
        imageUrl: "",
        message: "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.",
      };
    }

    return {
      success: false,
      imageUrl: "",
      message: error?.message || "Try-on servisine ulaşılamadı.",
    };
  }
};
