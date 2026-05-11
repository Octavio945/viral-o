import { Router, IRouter, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { generateIdeas } from "../services/openai";
import { createError } from "../middleware/errorHandler";

const router: IRouter = Router();

// POST /api/ideas/generate — générer et sauvegarder les idées en BDD
router.post("/generate", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, network } = req.body;
    if (!theme) return next(createError("Le thème est requis", 400));

    const profileResult = await db.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [req.userId]
    );
    if (profileResult.rows.length === 0) {
      return next(createError("Complétez votre profil avant de générer des idées", 400));
    }

    const profile = profileResult.rows[0];
    const ideas = await generateIdeas({ theme, network, profile });

    // Sauvegarder chaque idée en BDD et retourner avec leurs IDs
    const saved = await Promise.all(
      ideas.map((idea) =>
        db.query(
          `INSERT INTO ideas (user_id, theme, title, hook, hashtags, estimated_duration, network)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            req.userId,
            theme,
            idea.title,
            idea.hook,
            idea.hashtags ?? [],
            idea.estimated_duration ?? 60,
            network ?? null,
          ]
        ).then((r) => r.rows[0])
      )
    );

    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

// GET /api/ideas — historique des idées
router.get("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "SELECT * FROM ideas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
