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
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         required: ["email", "username", "displayName", "password"],
    //         properties: {
    //           email: { type: "string", example: "admin@portfolio.com" },
    //           username: { type: "string", example: "eleazar-admin" },
    //           displayName: { type: "string", example: "Eleazar Gamez" },
    //           password: { type: "string", example: "MyStrongPassword123" },
    //           role: { type: "string", enum: ["super_admin", "admin", "editor"], example: "super_admin" }
    //         }
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[201] = {
    //   description: 'Admin user created',
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           created: { type: "boolean", example: true },
    //           user: {
    //             type: "object",
    //             properties: {
    //               _id: { type: "string", example: "680335b5f26b2d6a6a8ed001" },
    //               email: { type: "string", example: "admin@portfolio.com" },
    //               username: { type: "string", example: "eleazar-admin" },
    //               displayName: { type: "string", example: "Eleazar Gamez" },
    //               role: { type: "string", example: "super_admin" },
    //               active: { type: "boolean", example: true },
    //               lastLoginAt: { type: "string", nullable: true, example: null }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    const result = await createAdminUser(req.body as Record<string, unknown>);
    res.status(201).json(result);
  }),
);

adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    // #swagger.summary = 'Login admin user and get JWT'
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         required: ["email", "password"],
    //         properties: {
    //           email: { type: "string", example: "admin@portfolio.com" },
    //           password: { type: "string", example: "MyStrongPassword123" }
    //         }
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[200] = {
    //   description: 'Authenticated admin session',
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           authenticated: { type: "boolean", example: true },
    //           accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
    //           tokenType: { type: "string", example: "Bearer" },
    //           user: {
    //             type: "object",
    //             properties: {
    //               _id: { type: "string", example: "680335b5f26b2d6a6a8ed001" },
    //               email: { type: "string", example: "admin@portfolio.com" },
    //               username: { type: "string", example: "eleazar-admin" },
    //               displayName: { type: "string", example: "Eleazar Gamez" },
    //               role: { type: "string", example: "super_admin" },
    //               active: { type: "boolean", example: true },
    //               lastLoginAt: { type: "string", example: "2026-04-19T15:30:00.000Z" }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
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
    // #swagger.parameters['year'] = { in: 'query', description: 'Filter by year', type: 'integer', example: 2026 }
    // #swagger.parameters['month'] = { in: 'query', description: 'Filter by month (1-12)', type: 'integer', example: 4 }
    // #swagger.parameters['day'] = { in: 'query', description: 'Filter by day of month', type: 'integer', example: 19 }
    // #swagger.parameters['from'] = { in: 'query', description: 'Start date ISO string', type: 'string', example: '2026-04-01T00:00:00.000Z' }
    // #swagger.parameters['to'] = { in: 'query', description: 'End date ISO string', type: 'string', example: '2026-04-19T23:59:59.999Z' }
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
