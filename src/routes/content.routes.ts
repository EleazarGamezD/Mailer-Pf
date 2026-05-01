import { Router } from 'express';

import type { ContentPayload, ProfilePayload } from '../core/interfaces/requests.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';
import {
  createContentItem,
  deleteContentItem,
  getProfile,
  listContent,
  updateContentItem,
  upsertProfile,
} from '../modules/content/content.service.js';

export const contentRouter = Router();

contentRouter.get(
  '/profile',
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Content']
    res.json(await getProfile());
  }),
);

contentRouter.put(
  '/profile',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Content']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    res.json(await upsertProfile(req.body as ProfilePayload));
  }),
);

const resourceNames = ['techSkills', 'experience', 'socialLinks', 'resumes', 'testimonials'] as const;

for (const resourceName of resourceNames) {
  contentRouter.get(
    `/${resourceName}`,
    asyncHandler(async (_req, res) => {
      // #swagger.tags = ['Content']
      res.json(await listContent(resourceName));
    }),
  );

  contentRouter.post(
    `/${resourceName}`,
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.status(201).json(await createContentItem(resourceName, req.body as ContentPayload));
    }),
  );

  contentRouter.patch(
    `/${resourceName}/:id`,
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.json(
        await updateContentItem(
          resourceName,
          getSingleParam(req.params.id, 'id'),
          req.body as ContentPayload,
        ),
      );
    }),
  );

  contentRouter.delete(
    `/${resourceName}/:id`,
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.json(await deleteContentItem(resourceName, getSingleParam(req.params.id, 'id')));
    }),
  );
}
