import { Router, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { generateScript } from "../services/openai";
import { createError } from "../middleware/errorHandler";

const router = Router();

// POST /api/scripts/generate — générer un script à partir d'une idée
router.post("/generate", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { idea_id, network } = req.body;
    if (!idea_id) return next(createError("L'identifiant de l'idée est requis", 400));

    const [ideaResult, profileResult] = await Promise.all([
      db.query("SELECT * FROM ideas WHERE id = $1 AND user_id = $2", [idea_id, req.userId]),
      db.query("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
    ]);

    if (ideaResult.rows.length === 0) return next(createError("Idée introuvable", 404));
    if (profileResult.rows.length === 0) return next(createError("Profil introuvable", 404));

    const idea = ideaResult.rows[0];
    const profile = profileResult.rows[0];
    const scriptContent = await generateScript({ idea, profile, network: network || idea.network });

    const saved = await db.query(
      `INSERT INTO scripts (idea_id, user_id, content, network)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [idea_id, req.userId, scriptContent, network || idea.network]
    );

    res.status(201).json({ success: true, data: saved.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/scripts/:id — modifier un script manuellement
router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, status } = req.body;
    const result = await db.query(
      `UPDATE scripts SET content = COALESCE($1, content),
         status = COALESCE($2, status), updated_at = NOW()
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [content, status, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return next(createError("Script introuvable", 404));
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
