import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
}

export function signAdminToken(payload: AdminJwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AdminJwtPayload;
}
