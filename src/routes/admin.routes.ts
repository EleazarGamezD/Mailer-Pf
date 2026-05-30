import { Router } from 'express';

import type {
  AnalyticsFiltersPayload,
  CreateAdminUserPayload,
  LoginAdminUserPayload,
  UpdateAdminUserPayload,
} from '../core/interfaces/requests.js';
import type { AuthenticatedAdminRequest } from '../core/interfaces/auth.js';
import { requireAdminAuth } from '../middlewares/admin-auth.middleware.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import {
  createAdminUser,
  getAdminUserById,
  listAdminUsers,
  loginAdminUser,
  seedDefaultThemes,
  seedDemoPersonalContent,
  seedStarterContent,
  updateAdminUser,
} from '../modules/admin/admin.service.js';
import { getDashboardMetrics } from '../modules/analytics/analytics.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const adminRouter = Router();

adminRouter.post(
  '/users',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Create admin user'
    const result = await createAdminUser(req.body as CreateAdminUserPayload);
    res.status(201).json(result);
  }),
);

adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.summary = 'Login admin user and get JWT'
    const result = await loginAdminUser(req.body as LoginAdminUserPayload);
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/users',
  requireAdminAuth,
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "BearerAuth": [] }]
    // #swagger.summary = 'List admin users'
    const users = await listAdminUsers();

    res.status(200).json({
      users,
    });
  }),
);

adminRouter.patch(
  '/users/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "BearerAuth": [] }]
    // #swagger.summary = 'Update admin user'
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await updateAdminUser(userId, req.body as UpdateAdminUserPayload);
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
    // #swagger.parameters['year'] = { in: 'query', description: 'Filter by year', type: 'integer', example: 2026 }
    // #swagger.parameters['month'] = { in: 'query', description: 'Filter by month (1-12)', type: 'integer', example: 4 }
    // #swagger.parameters['day'] = { in: 'query', description: 'Filter by day of month', type: 'integer', example: 19 }
    // #swagger.parameters['from'] = { in: 'query', description: 'Start date ISO string', type: 'string', example: '2026-04-01T00:00:00.000Z' }
    // #swagger.parameters['to'] = { in: 'query', description: 'End date ISO string', type: 'string', example: '2026-04-19T23:59:59.999Z' }
    const query = req.query as AnalyticsFiltersPayload;
    const result = await getDashboardMetrics(query);
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/seed-initial',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Run initial MongoDB seed'
    const preset = typeof req.query.preset === 'string' ? req.query.preset : 'starter';
    const result = preset === 'demo-personal'
      ? await seedDemoPersonalContent()
      : await seedStarterContent();

    const themesResult = await seedDefaultThemes();

    res.status(200).json({
      message: 'Initial seed executed successfully.',
      ...result,
      themes: themesResult,
    });
  }),
);

adminRouter.post(
  '/seed-themes',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Seed default themes'
    const force = req.query.force === 'true';
    const result = await seedDefaultThemes(force);
    res.status(200).json({
      message: 'Themes seed executed.',
      ...result,
    });
  }),
);

adminRouter.post(
  '/seed-demo-personal',
  requireApiKey,
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.summary = 'Run personal demo MongoDB seed'
    const result = await seedDemoPersonalContent();

    res.status(200).json({
      message: 'Personal demo seed executed successfully.',
      ...result,
    });
  }),
);
