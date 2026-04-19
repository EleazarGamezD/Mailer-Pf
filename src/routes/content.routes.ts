import { Router } from 'express';

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
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Content']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    res.json(await upsertProfile(req.body as Record<string, unknown>));
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
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.status(201).json(await createContentItem(resourceName, req.body as Record<string, unknown>));
    }),
  );

  contentRouter.patch(
    `/${resourceName}/:id`,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.json(
        await updateContentItem(
          resourceName,
          getSingleParam(req.params.id, 'id'),
          req.body as Record<string, unknown>,
        ),
      );
    }),
  );

  contentRouter.delete(
    `/${resourceName}/:id`,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.json(await deleteContentItem(resourceName, getSingleParam(req.params.id, 'id')));
    }),
  );
}
