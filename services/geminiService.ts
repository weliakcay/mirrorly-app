import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// 1. Robust Base64 Cleaner
const cleanBase64 = (base64: string) => {
  // Split at comma if it exists (data:image/png;base64,.....)
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// 2. Detect MimeType from Base64 Header
const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return 'image/jpeg'; // Default fallback
};

// Helper to convert URL to Base64
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting garment URL to base64:", error);
    throw new Error("Kıyafet görseli indirilemedi. İnternet bağlantınızı kontrol edin.");
  }
};

export const testApiKey = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest', 
            contents: 'Hello',
        });
        if (response.text) {
            return { success: true, message: "Bağlantı Başarılı!" };
        }
        return { success: false, message: "API cevap vermedi." };
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
          message: "API Anahtarı eksik. Lütfen mağaza panelinden anahtarı girin."
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Model Selection: Using the image editing specialized model if available
    const modelId = 'gemini-2.5-flash-image';

    // Prepare Images
    let garmentFullBase64 = "";
    if (garment.imageUrl.startsWith("data:")) {
        garmentFullBase64 = garment.imageUrl;
    } else {
        garmentFullBase64 = await urlToBase64(garment.imageUrl);
    }

    const userMimeType = getMimeType(userPhotoBase64);
    const garmentMimeType = getMimeType(garmentFullBase64);

    const userRawBase64 = cleanBase64(userPhotoBase64);
    const garmentRawBase64 = cleanBase64(garmentFullBase64);

    // Prompt Engineering
    const prompt = `
      You are an advanced AI Fashion Assistant specialized in virtual try-on technology.
      
      Task: Generate a photorealistic image of the person in the first image wearing the garment shown in the second image.

      Input 1 (Person): A user photo.
      Input 2 (Garment): ${garment.name} (${garment.description}).

      Guidelines:
      1. Replace the person's current outfit with the [Garment].
      2. Keep the person's face, hair, pose, and body shape EXACTLY the same.
      3. Maintain the original background and lighting of the person's photo.
      4. Ensure the fabric texture and drape of the garment looks realistic on the body.
      5. Output ONLY the resulting image. Do not provide text descriptions.
    `;

    // Safety Settings (Relaxed for Fashion/Body context)
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    console.log("Generating Try-On with model:", modelId);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: userMimeType, data: userRawBase64 } },
          { inlineData: { mimeType: garmentMimeType, data: garmentRawBase64 } }
        ]
      },
      config: {
        temperature: 0.4,
        safetySettings: safetySettings
      }
    });

    // --- Image Extraction Logic ---
    let generatedImage = null;
    
    // Check for inline data (image)
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    // If no image found, check if the model returned text (Error explanation)
    if (!generatedImage) {
        const textResponse = response.text || "";
        console.warn("Model returned text instead of image:", textResponse);
        
        if (textResponse.length > 5) {
            // Return the model's explanation to the user (e.g., "I cannot process this image...")
            // Translate common refusals for better UX
            if (textResponse.includes("safety") || textResponse.includes("policy")) {
                throw new Error("Güvenlik filtresi: Model bu fotoğrafı işlemeyi reddetti. Lütfen daha net ve standart bir poz deneyin.");
            }
            if (textResponse.includes("cannot identify")) {
                throw new Error("Model fotoğraftaki kişiyi net algılayamadı. Lütfen ışığı iyi bir fotoğraf yükleyin.");
            }
            // Return the raw text if it's a specific instruction
            throw new Error(`Model Mesajı: ${textResponse.substring(0, 100)}...`);
        }

        if (response.promptFeedback?.blockReason) {
             throw new Error(`Güvenlik Engeli: ${response.promptFeedback.blockReason}`);
        }
        
        throw new Error("Görüntü oluşturulamadı (Boş yanıt).");
    }

    return {
      success: true,
      imageUrl: generatedImage
    };

  } catch (error: any) {
    console.error("Gemini Try-On Fatal Error:", error);
    
    let userMessage = error.message;

    // Standardize specific API errors
    if (userMessage.includes("400")) userMessage = "Hatalı İstek (400): Gönderilen görsel formatı desteklenmiyor olabilir.";
    if (userMessage.includes("403")) userMessage = "Yetki Hatası (403): API anahtarının bu işlemi yapma izni yok veya kota doldu.";
    if (userMessage.includes("429")) userMessage = "Çok fazla istek (429): Lütfen 1 dakika bekleyip tekrar deneyin.";
    if (userMessage.includes("fetch")) userMessage = "Bağlantı Hatası: Görseller sunucuya iletilemedi.";

    return {
      success: false,
      imageUrl: "",
      message: userMessage
    };
  }
};