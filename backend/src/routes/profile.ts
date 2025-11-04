import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
export default router;
