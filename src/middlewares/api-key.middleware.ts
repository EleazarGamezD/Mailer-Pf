import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const isPublicMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

  if (isPublicMethod) {
    return next();
  }

  const apiKey = req.header('x-api-key');

  if (!apiKey || apiKey !== env.adminApiKey) {
    return res.status(401).json({
      message: 'Invalid or missing x-api-key header.',
    });
  }

  return next();
}
