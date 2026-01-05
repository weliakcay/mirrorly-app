import { GoogleGenAI } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// Helper to remove data URL prefix
const stripBase64Header = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
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
      console.warn("No API KEY provided. Returning mock response.");
      // Fallback for demo without key
      return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                imageUrl: garment.imageUrl // Just return garment for demo if no key
            });
        }, 3000);
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash-image for balanced speed and image capability
    const modelId = 'gemini-2.5-flash-image';

    const prompt = `
      Perform a virtual try-on.
      
      Input 1: An image of a person (the user).
      Input 2 (Description): A garment described as: "${garment.name} - ${garment.description}".
      
      Task: Generate a photorealistic image of the person from Input 1 wearing the garment described in Input 2.
      
      Requirements:
      1. Preserve the person's identity, facial features, hair, body shape, and pose exactly as they appear in the input photo.
      2. Preserve the background of the original photo.
      3. Replace the person's current outfit with the "${garment.name}".
      4. Ensure the lighting on the new garment matches the lighting of the original scene.
      5. The final image should look like a high-end fashion photo.
      6. Do not crop the head or face.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: stripBase64Header(userPhotoBase64)
            }
          }
        ]
      }
    });

    let generatedImage = null;
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!generatedImage) {
         console.log("Gemini returned text/no image:", response.text);
         // If the model refuses due to safety or capability, we might get text.
         // Return a specific error to show in UI
         throw new Error("The magic mirror couldn't process this reflection. Please try a different photo.");
    }

    return {
      success: true,
      imageUrl: generatedImage
    };

  } catch (error) {
    console.error("Gemini Try-On Error:", error);
    return {
      success: false,
      imageUrl: "",
      message: "The magic mirror is a bit cloudy right now. Please try again."
    };
  }
};