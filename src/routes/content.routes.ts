import { Router } from 'express';

import { contentResourceValues } from '../core/types/content.js';
import type { ContentListQuery, ContentPayload, ProfilePayload } from '../core/interfaces/requests.js';
import type { IPaginationOptions } from '../core/interfaces/common.interface.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';
import {
  createContentItem,
  deleteContentItem,
  getProfile,
  listContent,
  listContentPaginated,
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

const resourceNames = contentResourceValues;

for (const resourceName of resourceNames) {
  contentRouter.get(
    `/${resourceName}`,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      const paginationOptions = parsePaginationQuery(req.query as ContentListQuery);

      if (!hasPaginationQuery(paginationOptions)) {
        res.json(await listContent(resourceName));
        return;
      }

      res.json(await listContentPaginated(resourceName, paginationOptions));
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

function parsePaginationQuery(query: ContentListQuery): IPaginationOptions {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    page: Number.isFinite(page) && page > 0 ? page : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    sortBy: typeof query.sortBy === 'string' && query.sortBy.trim() ? query.sortBy.trim() : undefined,
    sortOrder: query.sortOrder === 'asc' || query.sortOrder === 'desc' ? query.sortOrder : undefined,
  };
}

function hasPaginationQuery(options: IPaginationOptions): boolean {
  return Boolean(options.page || options.limit || options.sortBy || options.sortOrder);
}
