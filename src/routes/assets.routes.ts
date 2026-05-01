import { Router } from 'express';

import { databaseFileService } from '../modules/files/index.js';
import { getSingleParam } from '../utils/request-param.js';
import { asyncHandler } from '../utils/async-handler.js';

export const assetsRouter = Router();

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
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(asset.buffer);
  }),
);
