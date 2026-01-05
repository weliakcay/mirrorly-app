import { GoogleGenAI } from "@google/genai";
import { ProcessingResult, Garment } from "../types";

// Helper to remove data URL prefix
const stripBase64Header = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

export const generateTryOnImage = async (
  userPhotoBase64: string,
  garment: Garment
): Promise<ProcessingResult> => {
  try {
    const apiKey = process.env.API_KEY;
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
    
    // We use gemini-2.5-flash-image for speed and multimodal capability
    // In a real production scenario, you might use 'imagen-3.0-generate-001' 
    // or a specialized VTON pipeline, but here we simulate the "Magic" with Gemini.
    const modelId = 'gemini-2.5-flash-image';

    const prompt = `
      You are a magical fashion mirror. 
      I will provide a photo of a user and a description of a garment: "${garment.name} - ${garment.description}".
      
      Please generate a new image of this user wearing this specific garment. 
      Maintain the user's pose, body type, and the background environment from the user's photo.
      The lighting should be natural and flattering.
      Make it look like a high-quality fashion photograph.
      Focus on the fit and the drape of the fabric.
    `;

    // Note: Direct "deepfake" style identity preservation is often restricted.
    // We frame this as a "virtual try-on visualization".
    
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

    // Check for generated image in response
    // For 'generateContent' with image models, sometimes it returns an image part, 
    // sometimes text if it refuses.
    
    let generatedImage = null;
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    // Fallback logic if the model returns text (e.g. "I can't do that") or fails
    if (!generatedImage) {
         // Attempting with Imagen if the first approach fails or for better quality logic
         // This block is hypothetical as we stick to the main request, 
         // but ensures the UI doesn't break.
         console.log("Gemini returned text/no image:", response.text);
         throw new Error("Could not generate image trial.");
    }

    return {
      success: true,
      imageUrl: generatedImage
    };

  } catch (error) {
    console.error("Gemini Try-On Error:", error);
    // Fallback for demo resilience
    return {
      success: false,
      imageUrl: "",
      message: "The magic mirror is a bit cloudy right now. Please try again."
    };
  }
};