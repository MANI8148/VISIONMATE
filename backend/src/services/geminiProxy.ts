import { GoogleGenAI, Chat } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// ✅ Ensure API key exists
if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ Missing GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
/**
 * 🔧 Centralized error handler for Gemini API calls
 */
function handleApiError(error: unknown, context: string): Error {
  console.error(`❌ Error in ${context}:`, error);
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("api key")) {
      return new Error("Invalid or missing Gemini API key. Check your .env file.");
    }
    return new Error(`Gemini error while ${context}: ${error.message}`);
  }
  return new Error(`Unknown error while ${context}.`);
}

/**
 * 🧭 Get navigation directions using Gemini 2.5
 */
export async function getNavigationDirections(
  origin: { lat: number; lon: number },
  destination: string
): Promise<string> {
  try {
    const prompt = `
You are a navigation assistant. Provide clear pedestrian-friendly,
turn-by-turn walking directions from latitude ${origin.lat}, longitude ${origin.lon} to ${destination}.
Mention landmarks and prefix hazards with "ALERT:".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // ✅ Access text correctly for the new SDK
    return response.text ?? "No response received from Gemini.";
  } catch (error) {
    throw handleApiError(error, "getting navigation directions");
  }
}

/**
 * 🖼️ Read all text from image
 */
export async function readTextFromImage(base64Image: string): Promise<string> {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    const prompt = `
Read all the text present in this image, including handwritten text.
Return only the text content, without additional commentary.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: prompt },
          ],
        },
      ],
    });

    return response.text ?? "No text could be extracted.";
  } catch (error) {
    throw handleApiError(error, "reading text from image");
  }
}

/**
 * 💬 Create persistent chat instance
 */
/**
 * 💬 Chat with Gemini
 */
export async function chatWithGemini(message: string | any[]): Promise<string> {
  try {
    const contents = Array.isArray(message)
      ? [{ role: "user", parts: message }] // multimodal
      : [{ role: "user", parts: [{ text: message }] }]; // text-only

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return response.text || "No response from Gemini.";
  } catch (error) {
    throw handleApiError(error, "chatting with Gemini");
  }
}

/**
 * 💬 Persistent chat for interactive use
 */
export function startChat(): Chat {
  return ai.chats.create({
    model: "gemini-2.0-flash",
    config: {
      systemInstruction:
        "You are a friendly assistant for visually impaired users. Describe clearly and helpfully what you see or what is asked.",
    },
  });
}