import { Router } from 'express';

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
