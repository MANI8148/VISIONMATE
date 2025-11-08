import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/mongodb"; 
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import geminiRoutes from "./routes/gemini";
import alertsRoutes from "./routes/alerts";
import chatRoutes from "./routes/chats";

dotenv.config();
const app = express();

// ✅ CORS configuration for frontend
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Test route
app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth route working ✅" });
});

// Connect MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/chats", chatRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
