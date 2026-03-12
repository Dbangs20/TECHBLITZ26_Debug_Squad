import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/http.js";

export function notFoundHandler(_request: Request, _response: Response, next: NextFunction) {
  next(new AppError(404, "Route not found"));
}

export function errorHandler(
  error: Error | AppError,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  response.status(statusCode).json({
    message: error.message || "Internal server error"
  });
}
