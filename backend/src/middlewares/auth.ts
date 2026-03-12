import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/http.js";

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new AppError(401, "Authentication required"));
  }

  try {
    request.user = verifyToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid token"));
  }
}
