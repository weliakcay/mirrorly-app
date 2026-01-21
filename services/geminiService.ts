import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// --- Helpers ---

// 1. Optimized Resize Image (Aggressive Mobile Optimization)
// Reduced default maxWidth from 800 -> 600 for faster mobile processing
const resizeImage = (base64Str: string, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      // Scale down significantly if huge
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      } else if (height > maxWidth) {
        width *= maxWidth / height;
        height = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Better quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Changed to medium for speed
        ctx.drawImage(img, 0, 0, width, height);

        // Aggressive compression for API speed (JPEG 0.6)
        // This prevents payload errors and timeouts
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      } else {
        // If canvas context fails (rare), return original
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      console.warn("Image load failed, using original.");
      resolve(base64Str);
    }
  });
};

const cleanBase64 = (base64: string) => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return 'image/jpeg';
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Robust URL fetcher that handles CORS issues common on mobile/web
const urlToBase64 = async (url: string): Promise<string> => {
  // Strategy 1: Try loading as HTML Image with CORS allowed (Most efficient)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Attempt to get CORS permission

      // Cache bust to prevent browser from serving a non-CORS cached version
      const safeUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
      img.src = safeUrl;

      // Add a quick timeout for image loading specifically
      const timer = setTimeout(() => reject(new Error("Image Load Timeout")), 8000);

      img.onload = () => {
        clearTimeout(timer);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        try {
          ctx.drawImage(img, 0, 0);
          // Convert to base64 immediately
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } catch (e) {
          // "Tainted canvas" error means server sent image but refused CORS
          reject(new Error('Canvas tainted (CORS rejected)'));
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Image load failed'));
      }
    });
  } catch (firstAttemptError) {
    console.warn("Standard load failed, switching to proxy...", firstAttemptError);

    // Strategy 2: Use a Proxy to bypass CORS completely
    try {
      // Encode URL twice to ensure special chars pass through proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s proxy timeout

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Proxy Status: ${response.status}`);
      const blob = await response.blob();
      return await blobToBase64(blob);
    } catch (proxyError) {
      console.error("Proxy failed:", proxyError);
      throw new Error("Kıyafet görseli indirilemedi. (Ağ/CORS Hatası)");
    }
  }
};

// Timeout Promise Helper
const timeoutPromise = (ms: number, errorMessage: string) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
};

// --- Main Functions ---

export const testApiKey = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: 'Hello',
    });
    return response.text ?
      { success: true, message: "Bağlantı Başarılı!" } :
      { success: false, message: "API cevap vermedi." };
  } catch (error: any) {
    return { success: false, message: `Hata: ${error.message || "Bilinmiyor"}` };
  }
};

export const generateTryOnImage = async (
  userPhotoBase64: string,
  garment: Garment
): Promise<ProcessingResult> => {
  try {
    // Use central API key from environment
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return {
        success: false,
        imageUrl: "",
        message: "Sistem yapılandırma hatası. Lütfen yönetici ile iletişime geçin."
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = 'gemini-2.5-flash-image';

    // 1. Prepare & Optimize User Image (600px)
    const resizedUserPhoto = await resizeImage(userPhotoBase64, 600);

    // 2. Prepare Garment Image
    let garmentFullBase64 = "";

    if (garment.imageUrl.startsWith("data:")) {
      garmentFullBase64 = await resizeImage(garment.imageUrl, 600);
    } else {
      const rawUrlBase64 = await urlToBase64(garment.imageUrl);
      garmentFullBase64 = await resizeImage(rawUrlBase64, 600);
    }

    const userMime = getMimeType(resizedUserPhoto);
    const garmentMime = getMimeType(garmentFullBase64);

    // 3. Construct Prompt
    const prompt = `
      You are an expert professional fashion retoucher.
      
      YOUR GOAL: Create a realistic "Virtual Try-On" photo.
      
      INPUTS:
      - IMAGE 1: The Client (Person).
      - IMAGE 2: The Garment (${garment.name} - ${garment.description}).

      STRICT INSTRUCTIONS:
      1. COMPOSITE the [Garment] onto the [Client]'s body naturally.
      2. REPLACE the client's original top/outfit completely with the new garment.
      3. PRESERVE the client's exact face, hair, skin tone, and body proportions. This is crucial.
      4. ADJUST lighting and shadows on the garment to match the client's photo environment.
      5. The result must look like a real photo taken in a studio. No cartoons.
      
      Output ONLY the final image.
    `;

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    console.log("Generating Try-On...");

    // RACE CONDITION: API Call vs 45s Timeout
    // If Gemini takes longer than 45s, we abort to prevent UI freezing forever.
    const response = await Promise.race([
      ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: userMime, data: cleanBase64(resizedUserPhoto) } },
            { inlineData: { mimeType: garmentMime, data: cleanBase64(garmentFullBase64) } }
          ]
        },
        config: {
          temperature: 0.3,
          safetySettings: safetySettings
        }
      }),
      timeoutPromise(45000, "İşlem çok uzun sürdü (45sn). Lütfen tekrar deneyin.")
    ]);

    // Check if result is a valid Gemini response
    // (If timeoutPromise wins, it throws error, so we land in catch block)

    // Type guard/check
    if (!('candidates' in response)) {
      throw new Error("Geçersiz sunucu yanıtı.");
    }

    let generatedImage = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!generatedImage) {
      const textResponse = response.text || "";
      console.warn("No image generated. Response:", textResponse);

      if (textResponse.toLowerCase().includes("safety") || textResponse.toLowerCase().includes("policy")) {
        throw new Error("Güvenlik Filtresi: Model bu fotoğrafı işlemeyi reddetti. Lütfen daha net ve standart bir poz deneyin.");
      }
      throw new Error("Görüntü oluşturulamadı. Lütfen tekrar deneyin.");
    }

    return {
      success: true,
      imageUrl: generatedImage
    };

  } catch (error: any) {
    console.error("Try-On Error:", error);
    let msg = error.message;
    if (msg.includes("429")) msg = "Sistem yoğun, lütfen 1 dakika bekleyin.";
    if (msg.includes("403")) msg = "API Anahtarı yetkisiz.";
    if (msg.includes("Failed to fetch")) msg = "İnternet bağlantısı hatası.";
    if (msg.includes("Image Load Timeout")) msg = "Kıyafet görseli yüklenemedi (Zaman aşımı).";

    return {
      success: false,
      imageUrl: "",
      message: msg
    };
  }
};