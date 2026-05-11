import { Router, IRouter, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { createError } from "../middleware/errorHandler";
import { runVideoJob } from "../services/videoGenerator";

const router: IRouter = Router();

// POST /api/videos/generate — lancer la génération d'une vidéo
router.post("/generate", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { script_id, network, voice_key } = req.body;
    if (!script_id) return next(createError("L'identifiant du script est requis", 400));

    const [scriptResult, profileResult] = await Promise.all([
      db.query("SELECT * FROM scripts WHERE id = $1 AND user_id = $2", [script_id, req.userId]),
      db.query("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
    ]);

    if (scriptResult.rows.length === 0) return next(createError("Script introuvable", 404));
    if (profileResult.rows.length === 0) return next(createError("Profil introuvable — complétez votre profil d'abord", 400));

    const script = scriptResult.rows[0];
    const profile = profileResult.rows[0];
    const targetNetwork = network || script.network || "tiktok";

    // Créer l'entrée vidéo en BDD avec statut "pending"
    const videoResult = await db.query(
      `INSERT INTO videos (script_id, user_id, status, network)
       VALUES ($1, $2, 'pending', $3) RETURNING *`,
      [script_id, req.userId, targetNetwork]
    );
    const video = videoResult.rows[0];

    // Répondre immédiatement — le traitement se fait en arrière-plan
    res.status(202).json({
      success: true,
      message: "Génération vidéo démarrée",
      data: video,
    });

    // Lancer le pipeline de façon asynchrone (sans bloquer la réponse)
    runVideoJob({
      videoId: video.id,
      scriptContent: script.content,
      profile,
      network: targetNetwork,
      ...(voice_key && { voiceKey: voice_key }),
    } as Parameters<typeof runVideoJob>[0]).catch((err) =>
      console.error("[videos/generate] Erreur non capturée :", err)
    );

  } catch (err) {
    next(err);
  }
});

// GET /api/videos — liste des vidéos
router.get("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [req.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/:id — statut d'une vidéo (polling)
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "SELECT * FROM videos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return next(createError("Vidéo introuvable", 404));
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/:id/download — télécharger le fichier MP4
router.get("/:id/download", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "SELECT * FROM videos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return next(createError("Vidéo introuvable", 404));

    const video = result.rows[0];
    if (video.status !== "ready") return next(createError("La vidéo n'est pas encore prête", 400));

    const filePath = path.join(process.cwd(), video.file_url);
    if (!fs.existsSync(filePath)) return next(createError("Fichier introuvable sur le serveur", 404));

    res.download(filePath, `viraleo-${video.id}.mp4`);
  } catch (err) {
    next(err);
  }
});

export default router;
