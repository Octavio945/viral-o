import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
