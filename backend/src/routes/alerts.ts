import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { Alert } from "../models/Alert";// use .js if you’re using ES modules

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    console.log("📩 Incoming alert body:", req.body);

    if (!message || !userId) {
      return res.status(400).json({ error: "Missing required fields: message or userId" });
    }

    // ✅ Ensure userId is a valid ObjectId string
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // ✅ Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const alert = new Alert({
      message,
      userId: userObjectId,
      createdAt: new Date(),
    });

    await alert.save();

    console.log("✅ Alert saved:", alert);
    res.status(201).json({ success: true, alert });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Alert save error:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("❌ Unknown error:", error);
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

export default router;