import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// --- Helpers ---

// 1. Optimized Resize Image (Memory Safe for Mobile)
const resizeImage = (base64Str: string, maxWidth = 800): Promise<string> => {
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
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Aggressive compression for API speed (JPEG 0.7)
          // This prevents payload errors and timeouts
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.warn("Direct fetch failed, using proxy...", error);
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy Status: ${response.status}`);
        const blob = await response.blob();
        return await blobToBase64(blob);
    } catch (proxyError) {
        throw new Error("Kıyafet görseli indirilemedi. İnternet bağlantınızı kontrol edin.");
    }
  }
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
  garment: Garment,
  dynamicApiKey?: string
): Promise<ProcessingResult> => {
  try {
    const apiKey = dynamicApiKey || process.env.API_KEY;

    if (!apiKey) {
      return {
          success: false,
          imageUrl: "",
          message: "API Anahtarı eksik. Mağaza girişinden ekleyebilirsiniz."
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = 'gemini-2.5-flash-image';

    // 1. Prepare & Optimize User Image
    // Resizing to 800px max width for optimal speed/quality balance
    const resizedUserPhoto = await resizeImage(userPhotoBase64, 800);

    // 2. Prepare Garment Image
    let garmentFullBase64 = "";
    if (garment.imageUrl.startsWith("data:")) {
        garmentFullBase64 = await resizeImage(garment.imageUrl, 800);
    } else {
        const rawUrlBase64 = await urlToBase64(garment.imageUrl);
        garmentFullBase64 = await resizeImage(rawUrlBase64, 800);
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

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: userMime, data: cleanBase64(resizedUserPhoto) } },
          { inlineData: { mimeType: garmentMime, data: cleanBase64(garmentFullBase64) } }
        ]
      },
      config: {
        temperature: 0.3, // Lower temperature for more fidelity
        safetySettings: safetySettings
      }
    });

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
    
    return {
      success: false,
      imageUrl: "",
      message: msg
    };
  }
};