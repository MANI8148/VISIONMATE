import express from "express";
import {
  getNavigationDirections,
  readTextFromImage,
  chatWithGemini,
} from "../services/geminiProxy";

const router = express.Router();

// 🧭 Navigation route
router.post("/navigate", async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const directions = await getNavigationDirections(origin, destination);
    res.json({ directions });
  } catch (error: any) {
    console.error("Navigation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🖼️ OCR route
router.post("/read-image", async (req, res) => {
  try {
    const { image } = req.body;
    const text = await readTextFromImage(image);
    res.json({ text });
  } catch (error: any) {
    console.error("OCR error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 💬 Chat route
router.post("/chat", async (req, res) => {
  try {
    let { message } = req.body;
    console.log("🧩 Incoming body to /chat:", JSON.stringify(req.body, null, 2));

    // 🧠 Allow string or array (for multimodal)
    if (Array.isArray(message)) {
      // ✅ pass array directly to Gemini
      const reply = await chatWithGemini(message);
      return res.json({ reply });
    }

    // unwrap nested object if present
    if (typeof message === "object" && message?.message) {
      message = message.message;
    }

    if (typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid request: 'message' must be a string or array."
      });
    }

    // ✅ plain text case
    const reply = await chatWithGemini(message);
    res.json({ reply });
  } catch (error: any) {
    console.error("❌ Chat route error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;