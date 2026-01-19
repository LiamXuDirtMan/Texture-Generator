
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Edits the current canvas using a text prompt.
   */
  async editTexture(base64Image: string, prompt: string): Promise<string | null> {
    try {
      // Removing prefix if exists
      const data = base64Image.replace(/^data:image\/(png|jpeg);base64,/, "");

      const response = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                data: data,
                mimeType: 'image/png',
              },
            },
            {
              text: `Maintain the pixel art style and 1:1 aspect ratio. Modify this Minecraft texture based on: ${prompt}. Return ONLY the image data.`,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Edit Error:", error);
      throw error;
    }
  }

  /**
   * Generates a new texture from scratch.
   */
  async generateNewTexture(prompt: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              text: `Generate a high-quality Minecraft-style 16x16 pixel art texture material for: ${prompt}. The output should be perfectly square, flat (no 3D perspectives), and suitable as a tiling material or mob skin part.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Generate Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
