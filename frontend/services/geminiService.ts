// src/services/geminiService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

async function postJSON(path: string, body: any) {
  const payload =
    typeof body === "string" || Array.isArray(body)
      ? { message: body } // ✅ wrap only if string/array
      : body;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function getNavigationDirections(origin: any, destination: string) {
  const data = await postJSON("/gemini/navigate", { origin, destination });
  return data.directions;
}

/**
 * 🖼️ Read text from an image
 */
export async function readTextFromImage(base64Image: string) {
  const data = await postJSON("/gemini/read-image", { image: base64Image });
  return data.text;
}

/**
 * 🧩 For normal text chat
 */
export async function sendTextChat(message: string) {
  const data = await postJSON("/gemini/chat", message); // ✅ sends raw string
  return data;
}

/**
 * 🖼️ For image analysis
 */
export async function analyzeImage(base64Image: string, userPrompt: string) {
  const message = [
    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
    { text: userPrompt || "Describe this image clearly and precisely." },
  ];
  const data = await postJSON("/gemini/chat", message); // ✅ send raw array
  return data;
}

/**
 * startChat(): returns object with:
 *  - sendMessage(message) -> Promise<{ response: { text: () => string }, text: string }>
 *  - sendMessageStream(message) -> Promise<AsyncIterable<{ text: string }>>
 *
 * This is intentionally compatible with several shapes used across your codebase.
 */

export function startChat() {
  return {
    async sendMessage(userMessage: string) {
      // calls backend and returns object compatible with older SDK usage
      // returns: { response: { text: () => replyText }, text: replyText }
      const { reply } = await sendTextChat(userMessage);
      const replyText = (typeof reply === "string") ? reply : (reply?.text ?? JSON.stringify(reply));
      return {
        response: { text: () => replyText },
        text: replyText,
      };
    },
    async sendMessageStream(userMessage: string): Promise<AsyncIterable<{ text: string }>> {
      const { reply } = await sendTextChat(userMessage);
      const replyText = (typeof reply === "string") ? reply : (reply?.text ?? JSON.stringify(reply));

      async function* gen() {
        // yield small chunks if you want — for now return single chunk
        yield { text: replyText };
      }
      // return the async iterable directly
      return gen();
    },
  };
}