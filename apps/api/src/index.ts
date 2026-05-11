import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import ideasRoutes from "./routes/ideas";
import scriptsRoutes from "./routes/scripts";
import videosRoutes from "./routes/videos";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ideas", ideasRoutes);
app.use("/api/scripts", scriptsRoutes);
app.use("/api/videos", videosRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Viraleo démarrée sur http://localhost:${PORT}`);
});

export default app;
