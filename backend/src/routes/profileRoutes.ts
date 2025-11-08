import express from "express";
import { getProfile, updateProfile } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);

export default router;