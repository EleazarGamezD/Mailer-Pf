import type { Request } from 'express';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
}

export type AuthenticatedAdminRequest = Request & {
  adminUser?: AdminJwtPayload;
};