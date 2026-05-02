import { Router } from 'express';
import { databaseFileService } from '../modules/files/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';

export const assetsRouter = Router();

assetsRouter.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
});

assetsRouter.options(
  '/:fileName',
  (_req, res) => {
    res.status(204).end();
  },
);

assetsRouter.get(
  '/:fileName',
  asyncHandler(async (req, res) => {
    const fileName = getSingleParam(req.params.fileName, 'fileName');
    const asset = await databaseFileService.getAsset(fileName);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found.' });
      return;
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', String(asset.size));
    res.send(asset.buffer);
  }),
);
