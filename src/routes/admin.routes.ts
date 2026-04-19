import { Router } from 'express';

import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { seedInitialContent } from '../modules/admin/admin.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { env } from '../config/env.js';

export const adminRouter = Router();

adminRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Admin']
    const body = req.body as Record<string, unknown>;
    res.json({
      authenticated: body.apiKey === env.adminApiKey,
    });
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
