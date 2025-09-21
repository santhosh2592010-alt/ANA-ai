
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ReferenceImage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerationResult {
  image: string | null;
  text: string | null;
}

export const generateConsistentCharacterImage = async (
  prompt: string,
  images: ReferenceImage[]
): Promise<GenerationResult> => {
  try {
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    }));

    const textPart = {
      text: prompt,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [...imageParts, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: GenerationResult = { image: null, text: null };

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                result.image = `data:${mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
                result.text = (result.text || '') + part.text;
            }
        }
    }
    
    if (!result.image && !result.text) {
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        const blockedRatings = candidate.safetyRatings?.filter(rating => rating.blocked);
        if (blockedRatings && blockedRatings.length > 0) {
            const categories = blockedRatings.map(rating => rating.category.replace('HARM_CATEGORY_', '')).join(', ');
            throw new Error(`Request blocked for safety reasons. Categories: ${categories}. Please adjust your prompt or images.`);
        }
        throw new Error("Request blocked due to safety settings. Please adjust your prompt or images.");
      }
      
      throw new Error("API returned an empty response. This might be due to a restrictive prompt or an internal error. Please try again with a different prompt.");
    }

    return result;
  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
        // Re-throw the original error to preserve its specific message
        throw error;
    }
    throw new Error("An unknown error occurred during image generation.");
  }
};
