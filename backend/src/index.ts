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
app.use(cors());
app.use(express.json());
app.get("/api/auth/test", (req, res) => {
  res.send("Auth route working ✅");
});

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/chats", chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
