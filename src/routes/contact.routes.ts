import { Router } from 'express';

import { asyncHandler } from '../utils/async-handler.js';
import { sendContactEmail, verifyCaptcha } from '../modules/contact/contact.service.js';

export const contactRouter = Router();

contactRouter.post(
  '/send',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Contact']
    res.json(await sendContactEmail(req.body as Record<string, unknown>));
  }),
);

contactRouter.post(
  '/verify-captcha',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Contact']
    res.json(await verifyCaptcha(req.body as Record<string, unknown>));
  }),
);
