import { Request, Response, NextFunction } from "express";
import { clerkClient, verifyToken } from "@clerk/express";
import { db } from "../db";
import { createError } from "./errorHandler";

export interface AuthRequest extends Request {
  userId?: string;
  clerkUserId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(createError("Non autorisé — token manquant", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const clerkUserId = payload.sub;

    const user = await syncUser(clerkUserId);
    req.userId = user.id;
    req.clerkUserId = clerkUserId;
    next();
  } catch {
    next(createError("Non autorisé — token invalide", 401));
  }
}

async function syncUser(clerkUserId: string): Promise<{ id: string }> {
  const existing = await db.query(
    "SELECT id FROM users WHERE clerk_id = $1",
    [clerkUserId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUserId}@clerk.local`;

  const created = await db.query(
    `INSERT INTO users (clerk_id, email)
     VALUES ($1, $2)
     ON CONFLICT (clerk_id) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [clerkUserId, email]
  );
  return created.rows[0];
}
