import { Router } from 'express';

import type { AnalyticsEventPayload } from '../core/interfaces/requests.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getDashboardMetrics, registerAnalyticsEvent } from '../modules/analytics/analytics.service.js';

export const analyticsRouter = Router();

analyticsRouter.post(
  '/event',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Analytics']
    res.status(201).json(await registerAnalyticsEvent(req.body as AnalyticsEventPayload));
  }),
);

analyticsRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Analytics']
    res.json(await getDashboardMetrics());
  }),
);
