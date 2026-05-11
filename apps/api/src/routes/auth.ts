import { Router, IRouter } from "express";

const router: IRouter = Router();

// POST /api/auth/register
router.post("/register", async (_req, res) => {
  // TODO: intégrer Clerk ou Auth.js
  res.json({ message: "Route register — à implémenter avec Clerk" });
});

// POST /api/auth/login
router.post("/login", async (_req, res) => {
  res.json({ message: "Route login — à implémenter avec Clerk" });
});

export default router;
