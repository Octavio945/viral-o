import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { createError } from "../middleware/errorHandler";

const router = Router();

// POST /api/videos/generate — lancer la génération d'une vidéo
router.post("/generate", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { script_id, network } = req.body;
    if (!script_id) return next(createError("L'identifiant du script est requis", 400));

    const scriptResult = await db.query(
      "SELECT * FROM scripts WHERE id = $1 AND user_id = $2",
      [script_id, req.userId]
    );
    if (scriptResult.rows.length === 0) return next(createError("Script introuvable", 404));

    // Créer l'entrée vidéo avec statut "pending"
    const video = await db.query(
      `INSERT INTO videos (script_id, user_id, status, network)
       VALUES ($1, $2, 'pending', $3) RETURNING *`,
      [script_id, req.userId, network || scriptResult.rows[0].network]
    );

    // TODO V2 : déclencher le pipeline asynchrone (ElevenLabs + DALL·E + FFmpeg)

    res.status(202).json({
      success: true,
      message: "Génération vidéo démarrée",
      data: video.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos — liste des vidéos de l'utilisateur
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

// GET /api/videos/:id — détail d'une vidéo (pour polling du statut)
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

export default router;
