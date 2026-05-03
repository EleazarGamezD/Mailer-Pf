import { Router } from 'express';

import type { ProjectListQuery, ProjectPayload } from '../core/interfaces/requests.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';
import {
  createProject,
  deleteProject,
  getProjectByIdOrSlug,
  listProjects,
  listProjectsPaginated,
  updateProject,
} from '../modules/projects/projects.service.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Projects']
    const query = _req.query as ProjectListQuery;
    const hasPaginationQuery =
      typeof query.page === 'string' ||
      typeof query.limit === 'string' ||
      typeof query.sortBy === 'string' ||
      typeof query.sortOrder === 'string';

    if (!hasPaginationQuery) {
      res.json(await listProjects());
      return;
    }

    const page = typeof query.page === 'string' ? Number.parseInt(query.page, 10) : undefined;
    const limit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : undefined;

    res.json(
      await listProjectsPaginated({
        page: Number.isFinite(page) ? page : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
        sortBy: typeof query.sortBy === 'string' ? query.sortBy : undefined,
        sortOrder: query.sortOrder === 'asc' || query.sortOrder === 'desc' ? query.sortOrder : undefined,
      }),
    );
  }),
);

projectsRouter.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Projects']
    res.json(await getProjectByIdOrSlug(getSingleParam(req.params.idOrSlug, 'idOrSlug')));
  }),
);

projectsRouter.post(
  '/',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Projects']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    res.status(201).json(await createProject(req.body as ProjectPayload));
  }),
);

projectsRouter.patch(
  '/:id',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Projects']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    res.json(await updateProject(getSingleParam(req.params.id, 'id'), req.body as ProjectPayload));
  }),
);

projectsRouter.delete(
  '/:id',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Projects']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    res.json(await deleteProject(getSingleParam(req.params.id, 'id')));
  }),
);
