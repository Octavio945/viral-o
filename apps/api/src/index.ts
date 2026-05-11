import express, { Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import ideasRoutes from "./routes/ideas";
import scriptsRoutes from "./routes/scripts";
import videosRoutes from "./routes/videos";
import statsRoutes from "./routes/stats";
import { errorHandler } from "./middleware/errorHandler";
import { testConnection } from "./db";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Créer les dossiers nécessaires au démarrage
["output", "temp"].forEach((dir) => {
  const p = path.join(process.cwd(), dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Servir les vidéos générées en statique
app.use(
  "/output",
  express.static(path.join(process.cwd(), "output"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ideas", ideasRoutes);
app.use("/api/scripts", scriptsRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/stats", statsRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`\n🚀 API Viraleo démarrée sur http://localhost:${PORT}`);
  try {
    const time = await testConnection();
    console.log(`✅ PostgreSQL connecté — ${time}`);
  } catch (err) {
    console.error("❌ PostgreSQL non connecté :", (err as Error).message);
    console.error("   → Vérifiez DATABASE_URL dans apps/api/.env");
  }
});

export default app;
