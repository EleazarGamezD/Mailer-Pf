import { Router } from 'express';
import type { ThemePayload } from '../core/interfaces/theme.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import {
  activateTheme,
  createTheme,
  deleteTheme,
  generatePalette,
  getActiveTheme,
  listThemes,
  updateTheme,
} from '../modules/themes/themes.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';

export const themesRouter = Router();

themesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await listThemes());
  }),
);

themesRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const theme = await getActiveTheme();
    res.json(theme);
  }),
);

themesRouter.get(
  '/generate-palette',
  requireApiKey,
  asyncHandler(async (req, res) => {
    const hex = typeof req.query.hex === 'string' ? req.query.hex : '';
    const mode = typeof req.query.mode === 'string' ? req.query.mode : 'analogic-complement';
    const seed = typeof req.query.seed === 'string' ? req.query.seed : '';
    res.json(await generatePalette(hex, mode, seed));
  }),
);

themesRouter.post(
  '/',
  requireApiKey,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createTheme(req.body as ThemePayload));
  }),
);

themesRouter.patch(
  '/:id',
  requireApiKey,
  asyncHandler(async (req, res) => {
    res.json(await updateTheme(getSingleParam(req.params.id, 'id'), req.body as ThemePayload));
  }),
);

themesRouter.delete(
  '/:id',
  requireApiKey,
  asyncHandler(async (req, res) => {
    await deleteTheme(getSingleParam(req.params.id, 'id'));
    res.json({ deleted: true });
  }),
);

themesRouter.post(
  '/:id/activate',
  requireApiKey,
  asyncHandler(async (req, res) => {
    res.json(await activateTheme(getSingleParam(req.params.id, 'id')));
  }),
);
