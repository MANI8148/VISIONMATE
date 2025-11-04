// backend/src/routes/chats.ts
import express from "express";
import { Chat } from "../models/Chat";

const router = express.Router();

// create chat
router.post("/", async (req, res) => {
  try {
    const { userId, role, message } = req.body; // 👈 use message, not text
    if (!userId || !role || !message) {
      return res.status(400).json({ error: "Missing userId, role, or message" });
    }

    const chat = await Chat.create({ userId, role, message });
    res.status(201).json(chat);
  } catch (err) {
    console.error("❌ Save chat error:", err);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

// get recent chats
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const chats = await Chat.find({}).sort({ createdAt: -1 }).limit(limit);
    res.json(chats);
  } catch (err) {
    console.error("get chats error", err);
    res.status(500).json({ error: "Failed to get chats" });
  }
});

export default router;