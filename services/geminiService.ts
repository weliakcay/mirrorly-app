import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// Helper to remove data URL prefix to get raw base64
const stripBase64Header = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

// Helper to convert a URL (like Firebase Storage URL) to Base64
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(stripBase64Header(base64String));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting garment URL to base64:", error);
    throw new Error("Could not process garment image. Please check internet connection.");
  }
};

export const generateTryOnImage = async (
  userPhotoBase64: string,
  garment: Garment,
  dynamicApiKey?: string
): Promise<ProcessingResult> => {
  try {
    // Priority: Dynamic Key (from DB) > Env Key (from .env file)
    const apiKey = dynamicApiKey || process.env.API_KEY;

    if (!apiKey) {
      console.warn("No API KEY provided.");
      return {
          success: false,
          imageUrl: "",
          message: "System Error: No AI Key configured. Please ask the boutique owner to check settings in the Merchant Dashboard."
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Use the latest vision-capable model
    const modelId = 'gemini-2.5-flash-image';

    // 1. Prepare Garment Image (Convert URL to Base64)
    let garmentBase64 = "";
    if (garment.imageUrl.startsWith("data:")) {
        garmentBase64 = stripBase64Header(garment.imageUrl);
    } else {
        garmentBase64 = await urlToBase64(garment.imageUrl);
    }

    // 2. Prepare User Image
    const userBase64 = stripBase64Header(userPhotoBase64);

    // 3. Construct a Robust Prompt
    // We explicitly define roles for the images to avoid confusion.
    const prompt = `
      Act as an expert AI Fashion Stylist and Photo Editor.
      
      You have received two images:
      [IMAGE 1]: The "Customer" (a photo of a person).
      [IMAGE 2]: The "Garment" (a product photo of: ${garment.name} - ${garment.description}).

      YOUR TASK:
      Create a highly photorealistic image of the [Customer] wearing the [Garment].

      CRITICAL INSTRUCTIONS:
      1. IDENTITY: You MUST preserve the [Customer]'s face, hair, skin tone, body shape, and pose exactly. Do not change the person.
      2. CLOTHING: Replace the [Customer]'s original clothes with the [Garment]. 
      3. FIT: The [Garment] must drape naturally over the [Customer]'s body. Account for lighting and shadows.
      4. BACKGROUND: Keep the original background of the [Customer] photo if possible, or use a neutral boutique background.
      5. QUALITY: The output must look like a real photograph, not a cartoon.

      Output ONLY the generated image.
    `;

    // 4. Configure Safety Settings
    // Fashion images often trigger false positives for 'Sexually Explicit' categories due to skin exposure.
    // We relax these slightly to allow for legitimate clothing try-on.
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];

    console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming inputs are generally jpegs/pngs, the API is forgiving here
              data: userBase64
            }
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: garmentBase64
            }
          }
        ]
      },
      config: {
        temperature: 0.4, // Lower temperature for better adherence to the input images
        safetySettings: safetySettings
      }
    });

    let generatedImage = null;
    
    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!generatedImage) {
         console.warn("Gemini Response blocked or text-only:", response.text);
         
         // specific handling if blocked by safety
         if (response.promptFeedback?.blockReason) {
             throw new Error(`Image generation blocked by safety filters (${response.promptFeedback.blockReason}). Please try a different photo.`);
         }
         
         throw new Error("The magic mirror couldn't generate a reflection. Please try a clearer photo.");
    }

    return {
      success: true,
      imageUrl: generatedImage
    };

  } catch (error: any) {
    console.error("Gemini Try-On Error:", error);
    
    let userMessage = "The magic mirror is having trouble seeing clearly. Please try again.";
    
    if (error.message?.includes("API Key")) {
        userMessage = "Configuration Error: Invalid API Key. Please verify in Merchant Dashboard.";
    } else if (error.message?.includes("blocked")) {
        userMessage = "The image could not be processed due to safety filters. Please try a different pose or photo.";
    } else if (error.message?.includes("fetch")) {
        userMessage = "Connection Error: Could not download the garment image.";
    }

    return {
      success: false,
      imageUrl: "",
      message: userMessage
    };
  }
};