import type { NextFunction, Request, Response } from 'express';

import type { HttpError } from '../core/interfaces/error.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

export function errorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const isProd = process.env['NODE_ENV'] === 'production';

  res.status(statusCode).json({
    message,
    ...(!isProd && error.details ? { details: error.details } : {}),
  });
}
