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

  const badgeX = 48;
  const badgeY = 44;
  const badgeWidth = 210;
  const badgeHeight = 48;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 24);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "600 22px sans-serif";
  ctx.fillText("Mirrorly Demo", badgeX + 28, badgeY + 31);

  if (garmentImage) {
    const cardWidth = Math.min(300, outputWidth * 0.28);
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

  const contentX = 48;
  const contentY = outputHeight - 250;
  const contentWidth = outputWidth - 96;

  ctx.fillStyle = "#f3f4f6";
  ctx.font = "700 54px serif";
  ctx.fillText("Onizleme hazir", contentX, contentY);

  ctx.fillStyle = "rgba(243, 244, 246, 0.92)";
  ctx.font = "400 28px sans-serif";

  const description =
    "Canli AI baglantisi tamamlanana kadar sonuc akisini kapatmamak icin hazirlanan demo goruntusu.";
  const words = description.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > contentWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, contentX, contentY + 52 + index * 36);
  });

  ctx.fillStyle = "#d4af37";
  ctx.font = "600 30px sans-serif";
  ctx.fillText(garmentName, contentX, contentY + 145);

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
  garmentName: string
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
      if (shouldFallbackToDemo(response.status, payload.message)) {
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
        message: payload.message || "Try-on işlemi tamamlanamadı.",
      };
    }

    return {
      ...(payload as ProcessingResult),
      mode: "live",
    };
  } catch (error: any) {
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
