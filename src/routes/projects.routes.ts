import { Router } from 'express';

import type { ProjectPayload } from '../core/interfaces/requests.js';
import { requireApiKey } from '../middlewares/api-key.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getSingleParam } from '../utils/request-param.js';
import {
  createProject,
  deleteProject,
  getProjectByIdOrSlug,
  listProjects,
  updateProject,
} from '../modules/projects/projects.service.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    // #swagger.tags = ['Projects']
    res.json(await listProjects());
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
