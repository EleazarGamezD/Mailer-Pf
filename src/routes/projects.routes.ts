import { Router } from 'express';

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
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         required: ["slug", "title", "summary", "description"],
    //         properties: {
    //           slug: { type: "string", example: "tu-bodega-api" },
    //           title: { type: "object", properties: { es: { type: "string", example: "Tu Bodega API" }, en: { type: "string", example: "Tu Bodega API" } } },
    //           summary: { type: "object", properties: { es: { type: "string", example: "API de e-commerce escalable." }, en: { type: "string", example: "Scalable e-commerce API." } } },
    //           description: { type: "object", properties: { es: { type: "string", example: "Descripcion larga del proyecto." }, en: { type: "string", example: "Long project description." } } },
    //           stack: { type: "array", items: { type: "string" }, example: ["NestJS", "TypeScript", "PostgreSQL"] },
    //           images: { type: "array", items: { type: "object" }, example: [] },
    //           coverImage: { nullable: true, example: null },
    //           projectLink: { type: "string", example: "https://tu-bodega.vercel.app/" },
    //           codeLink: { type: "string", example: "https://github.com/user/repo" },
    //           featured: { type: "boolean", example: true },
    //           status: { type: "string", example: "published" },
    //           publishedAt: { type: "string", example: "2026-04-19" }
    //         }
    //       }
    //     }
    //   }
    // }
    res.status(201).json(await createProject(req.body as Record<string, unknown>));
  }),
);

projectsRouter.patch(
  '/:id',
  requireApiKey,
  asyncHandler(async (req, res) => {
    // #swagger.tags = ['Projects']
    // #swagger.security = [{ "ApiKeyAuth": [] }]
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           title: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
    //           summary: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
    //           description: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
    //           stack: { type: "array", items: { type: "string" } },
    //           projectLink: { type: "string" },
    //           codeLink: { type: "string" },
    //           featured: { type: "boolean" },
    //           status: { type: "string" },
    //           publishedAt: { type: "string" }
    //         }
    //       }
    //     }
    //   }
    // }
    res.json(await updateProject(getSingleParam(req.params.id, 'id'), req.body as Record<string, unknown>));
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
