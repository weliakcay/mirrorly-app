import { ProcessingResult } from "../types";

const TRY_ON_MODE = String(import.meta.env.VITE_TRYON_MODE || "live").toLowerCase();
const ENABLE_DEMO_TRYON_FALLBACK = TRY_ON_MODE === "demo";

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

const loadImage = (src: string, allowCors = false): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    if (allowCors) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gorsel yuklenemedi."));
    img.src = src;
  });
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

const createDemoPreviewImage = async (
  userPhotoBase64: string,
  garmentImageUrl: string,
  garmentName: string
): Promise<string> => {
  const userImage = await loadImage(userPhotoBase64);
  const garmentImage = await loadImage(garmentImageUrl, true).catch(() => null);

  const outputHeight = 1440;
  const outputWidth = Math.max(960, Math.round((userImage.width / userImage.height) * outputHeight));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return userPhotoBase64;
  }

  ctx.fillStyle = "#f4efe8";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(userImage, 0, 0, outputWidth, outputHeight);

  const topGradient = ctx.createLinearGradient(0, 0, 0, outputHeight * 0.35);
  topGradient.addColorStop(0, "rgba(17, 24, 39, 0.42)");
  topGradient.addColorStop(1, "rgba(17, 24, 39, 0)");
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, outputWidth, outputHeight * 0.35);

  const bottomGradient = ctx.createLinearGradient(0, outputHeight * 0.52, 0, outputHeight);
  bottomGradient.addColorStop(0, "rgba(17, 24, 39, 0)");
  bottomGradient.addColorStop(1, "rgba(17, 24, 39, 0.9)");
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, outputHeight * 0.52, outputWidth, outputHeight * 0.48);

  const badgeX = 42;
  const badgeY = 38;
  const badgeHeight = 42;
  const badgeWidth = 150;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 21);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeX + 22, badgeY + badgeHeight / 2, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 700 16px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", badgeX + 22, badgeY + badgeHeight / 2 + 1);
  ctx.restore();

  ctx.fillStyle = "#111827";
  ctx.font = "italic 600 18px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Mirrorly", badgeX + 42, badgeY + 27);

  if (garmentImage) {
    const cardWidth = Math.min(250, outputWidth * 0.24);
    const cardHeight = cardWidth * 1.28;
    const cardX = outputWidth - cardWidth - 42;
    const cardY = 42;

    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.24)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 28);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, cardX + 12, cardY + 12, cardWidth - 24, cardHeight - 24, 20);
    ctx.clip();
    ctx.drawImage(garmentImage, cardX + 12, cardY + 12, cardWidth - 24, cardHeight - 24);
    ctx.restore();
  }

  const ctaText = "Logosuz sonuc icin giris yap";
  ctx.font = "500 24px sans-serif";
  const ctaWidth = Math.min(outputWidth - 92, ctx.measureText(ctaText).width + 64);
  const ctaHeight = 52;
  const ctaX = (outputWidth - ctaWidth) / 2;
  const ctaY = outputHeight - 108;

  drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, 26);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "500 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ctaText, outputWidth / 2, ctaY + ctaHeight / 2 + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  return canvas.toDataURL("image/jpeg", 0.9);
};

const shouldFallbackToDemo = (status: number, message?: string) => {
  const normalized = (message || "").toLowerCase();

  if (status >= 500) return true;

  return (
    normalized.includes("firebase admin") ||
    normalized.includes("kie_api_key") ||
    normalized.includes("try-on route error") ||
    normalized.includes("sunucudan gecerli bir yanit") ||
    normalized.includes("function_invocation_failed")
  );
};

export const generateTryOnImage = async (
  userPhotoBase64: string,
  garmentId: string,
  garmentImageUrl: string,
  garmentName: string,
  customerUid?: string,
  customerAuthToken?: string,
  merchantUid?: string
): Promise<ProcessingResult> => {
  try {
    const optimizedPhoto = await resizeImage(userPhotoBase64);
    const controller = new AbortController();
    // Sunucu maxDuration 150s + poll 135s'in hafif ustunde → sunucunun kendi hata
    // JSON'u client abort'tan once yetissin (yavas mobil calismalar tamamlanabilsin).
    const timeoutId = setTimeout(() => controller.abort(), 155_000);

    const response = await fetch("/api/try-on", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        garmentId,
        userPhotoDataUrl: optimizedPhoto,
        customerUid,
        customerAuthToken,
        merchantUid,
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
      if (!ENABLE_DEMO_TRYON_FALLBACK) {
        return {
          success: false,
          imageUrl: "",
          message: rawText || "Sunucudan gecerli bir yanit alinamadi.",
        };
      }

      const demoImageUrl = await createDemoPreviewImage(
        optimizedPhoto,
        garmentImageUrl,
        garmentName
      );

      return {
        success: true,
        imageUrl: demoImageUrl,
        message: "Demo onizleme kullanildi.",
        mode: "demo",
      };
    }

    if (!response.ok || payload.success === false) {
      if (
        ENABLE_DEMO_TRYON_FALLBACK &&
        shouldFallbackToDemo(response.status, payload.message)
      ) {
        const demoImageUrl = await createDemoPreviewImage(
          optimizedPhoto,
          garmentImageUrl,
          garmentName
        );

        return {
          success: true,
          imageUrl: demoImageUrl,
          message: payload.message || "Demo onizleme kullanildi.",
          mode: "demo",
        };
      }

        return {
          success: false,
          imageUrl: "",
          message: payload.message || "Try-on islemi tamamlanamadi.",
        };
      }

    return {
      ...(payload as ProcessingResult),
      mode: "live",
    };
  } catch (error: any) {
    if (!ENABLE_DEMO_TRYON_FALLBACK) {
      if (error?.name === "AbortError") {
        return {
          success: false,
          imageUrl: "",
          message: "Islem zaman asimina ugradi. Lutfen tekrar deneyin.",
        };
      }

      return {
        success: false,
        imageUrl: "",
        message: error?.message || "Try-on servisine ulasilamadi.",
      };
    }

    const demoImageUrl = await createDemoPreviewImage(
      userPhotoBase64,
      garmentImageUrl,
      garmentName
    );

    if (error?.name === "AbortError") {
      return {
        success: true,
        imageUrl: demoImageUrl,
        message: "Demo onizleme kullanildi.",
        mode: "demo",
      };
    }

    return {
      success: true,
      imageUrl: demoImageUrl,
      message: error?.message || "Demo onizleme kullanildi.",
      mode: "demo",
    };
  }
};
