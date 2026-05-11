import { Router, IRouter, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";

const router: IRouter = Router();

// GET /api/stats — stats résumées pour le dashboard
router.get("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [ideas, scripts, videos, profile] = await Promise.all([
      db.query("SELECT COUNT(*) FROM ideas   WHERE user_id = $1", [req.userId]),
      db.query("SELECT COUNT(*) FROM scripts WHERE user_id = $1", [req.userId]),
      db.query("SELECT COUNT(*) FROM videos  WHERE user_id = $1 AND status = 'ready'", [req.userId]),
      db.query("SELECT id FROM profiles WHERE user_id = $1", [req.userId]),
    ]);

    res.json({
      success: true,
      data: {
        ideas:          parseInt(ideas.rows[0].count,   10),
        scripts:        parseInt(scripts.rows[0].count, 10),
        videos_ready:   parseInt(videos.rows[0].count,  10),
        profile_done:   profile.rows.length > 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
