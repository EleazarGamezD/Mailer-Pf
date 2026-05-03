import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { AdminJwtPayload } from '../core/interfaces/auth.js';

export type { AdminJwtPayload } from '../core/interfaces/auth.js';

export function signAdminToken(payload: AdminJwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AdminJwtPayload;
}
