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
  requestPasswordReset,
  resetPasswordWithToken,
  setupAdminAccount,
  updateAdminUser,
} from '../modules/admin/admin.service.js';
import {
  getInitialSeedStatus,
  seedDefaultThemes,
  seedDemoPersonalContent,
  seedInitialContent,
} from '../modules/admin/seed.service.js';
import { getDashboardMetrics } from '../modules/analytics/analytics.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const adminRouter = Router();

adminRouter.post(
  '/users',
  requireApiKey,
  asyncHandler(async (req, res) => {
    const result = await createAdminUser(req.body as CreateAdminUserPayload);
    res.status(201).json(result);
  }),
);

adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const result = await loginAdminUser(req.body as LoginAdminUserPayload);
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/auth/setup-account',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const adminUser = (req as AuthenticatedAdminRequest).adminUser;
    const result = await setupAdminAccount(adminUser!.sub, req.body);
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/auth/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const result = await requestPasswordReset(email ?? '');
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/auth/reset-password',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    const result = await resetPasswordWithToken(token ?? '', newPassword ?? '');
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/users',
  requireAdminAuth,
  asyncHandler(async (_req, res) => {
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
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await updateAdminUser(userId, req.body as UpdateAdminUserPayload);
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/me',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const adminUser = (req as AuthenticatedAdminRequest).adminUser;
    const user = adminUser ? await getAdminUserById(adminUser.sub) : null;

    res.status(200).json({
      authenticated: Boolean(user),
      user,
    });
  }),
);

adminRouter.get(
  '/seed-status',
  requireApiKey,
  asyncHandler(async (_req, res) => {
    const status = await getInitialSeedStatus();

    res.status(200).json(status);
  }),
);

adminRouter.get(
  '/dashboard/metrics',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const query = req.query as AnalyticsFiltersPayload;
    const result = await getDashboardMetrics(query);
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/seed-initial',
  requireApiKey,
  asyncHandler(async (_req, res) => {
    const result = await seedInitialContent();

    res.status(200).json({
      message: 'Initial platform seed executed successfully.',
      ...result,
    });
  }),
);

adminRouter.post(
  '/seed-themes',
  requireApiKey,
  asyncHandler(async (req, res) => {
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
    const result = await seedDemoPersonalContent();

    res.status(200).json({
      message: 'Personal demo seed executed successfully.',
      ...result,
    });
  }),
);
