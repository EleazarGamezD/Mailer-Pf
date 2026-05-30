import { Router } from 'express';
import type { TranslateRequest } from '../core/interfaces/translate.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { translateText } from '../modules/translate/translate.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const translateRouter = Router();

translateRouter.post(
  '/',
  requireApiKey,
  asyncHandler(async (req, res) => {
    console.log('Received translation request:', req.body);
    const result = await translateText(req.body as TranslateRequest);
    res.json(result);
  }),
);
