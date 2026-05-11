import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createError("Non autorisé — token manquant", 401));
  }

  const token = authHeader.split(" ")[1];

  // TODO: vérifier le JWT (Clerk ou Auth.js) ici
  if (!token) {
    return next(createError("Non autorisé — token invalide", 401));
  }

  // Temporairement on extrait le userId depuis le token (à remplacer par vérification JWT réelle)
  req.userId = token;
  next();
}
