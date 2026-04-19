import { Router } from 'express';

import { requireAdminAuth, type AuthenticatedAdminRequest } from '../middlewares/admin-auth.middleware.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import {
  createAdminUser,
  getAdminUserById,
  loginAdminUser,
  seedInitialContent,
} from '../modules/admin/admin.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getDashboardMetrics } from '../modules/analytics/analytics.service.js';

export const adminRouter = Router();

adminRouter.post(
  '/users',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Create admin user'
    const result = await createAdminUser(req.body as Record<string, unknown>);
    res.status(201).json(result);
  }),
);

adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.summary = 'Login admin user and get JWT'
    const result = await loginAdminUser(req.body as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/me',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "BearerAuth": [] }]
    // #swagger.summary = 'Get current admin user'
    const adminUser = (req as AuthenticatedAdminRequest).adminUser;
    const user = adminUser ? await getAdminUserById(adminUser.sub) : null;

    res.status(200).json({
      authenticated: Boolean(user),
      user,
    });
  }),
);

adminRouter.get(
  '/dashboard/metrics',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "BearerAuth": [] }]
    // #swagger.summary = 'Get admin dashboard metrics'
    const query = req.query as Record<string, unknown>;
    const result = await getDashboardMetrics(query);
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/seed-initial',
  requireApiKey,
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Run initial MongoDB seed'
    const result = await seedInitialContent();

    res.status(200).json({
      message: 'Initial seed executed successfully.',
      ...result,
    });
  }),
);
