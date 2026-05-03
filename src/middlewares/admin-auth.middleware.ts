import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedAdminRequest } from '../core/interfaces/auth.js';
import { verifyAdminToken } from '../utils/jwt.js';

export type { AuthenticatedAdminRequest } from '../core/interfaces/auth.js';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.header('authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Missing Bearer token.',
    });
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  try {
    const payload = verifyAdminToken(token);
    (req as AuthenticatedAdminRequest).adminUser = payload;
    return next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired admin token.',
    });
  }
}
