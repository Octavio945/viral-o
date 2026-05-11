import { Router, IRouter, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { createError } from "../middleware/errorHandler";

const router: IRouter = Router();

// GET /api/profile — récupérer le profil de l'utilisateur connecté
router.get("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) {
      return next(createError("Profil introuvable", 404));
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/profile — créer ou mettre à jour le profil
router.post("/", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      company_name,
      sector,
      target_audience,
      products_services,
      communication_style,
      social_networks,
      brand_colors,
      logo_url,
    } = req.body;

    const result = await db.query(
      `INSERT INTO profiles
        (user_id, company_name, sector, target_audience, products_services,
         communication_style, social_networks, brand_colors, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         sector = EXCLUDED.sector,
         target_audience = EXCLUDED.target_audience,
         products_services = EXCLUDED.products_services,
         communication_style = EXCLUDED.communication_style,
         social_networks = EXCLUDED.social_networks,
         brand_colors = EXCLUDED.brand_colors,
         logo_url = EXCLUDED.logo_url,
         updated_at = NOW()
       RETURNING *`,
      [
        req.userId,
        company_name,
        sector,
        target_audience,
        products_services,
        communication_style,
        social_networks || [],
        brand_colors || [],
        logo_url || null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
