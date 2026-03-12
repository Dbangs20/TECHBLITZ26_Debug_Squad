import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "../models/User.js";
import { AppError } from "../utils/http.js";

export function requireRole(roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, "You do not have access to this resource"));
    }

    next();
  };
}
