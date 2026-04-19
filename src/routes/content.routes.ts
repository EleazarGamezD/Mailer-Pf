import { Router } from 'express';

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
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         required: ["key", "slug", "title", "description", "label"],
    //         properties: {
    //           key: { type: "string", example: "main-profile" },
    //           slug: { type: "string", example: "main-profile" },
    //           label: { type: "object", properties: { es: { type: "string", example: "Eleazar Gamez" }, en: { type: "string", example: "Eleazar Gamez" } } },
    //           title: { type: "object", properties: { es: { type: "string", example: "Desarrollador Fullstack" }, en: { type: "string", example: "Fullstack Developer" } } },
    //           description: { type: "object", properties: { es: { type: "string", example: "Descripcion principal del perfil." }, en: { type: "string", example: "Main profile description." } } },
    //           availability: { type: "string", example: "Open to work" },
    //           location: { type: "string", example: "Colombia" },
    //           email: { type: "string", example: "hello@portfolio.com" },
    //           phone: { type: "string", example: "+57 3000000000" },
    //           metadata: { type: "object", example: { about: { es: "Sobre mi", en: "About me" }, heroSlides: [] } }
    //         }
    //       }
    //     }
    //   }
    // }
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
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      // #swagger.requestBody = {
      //   required: true,
      //   content: {
      //     "application/json": {
      //       schema: {
      //         type: "object",
      //         required: ["slug", "title", "description", "label"],
      //         properties: {
      //           slug: { type: "string", example: "github" },
      //           label: { type: "object", properties: { es: { type: "string", example: "GitHub" }, en: { type: "string", example: "GitHub" } } },
      //           title: { type: "object", properties: { es: { type: "string", example: "GitHub" }, en: { type: "string", example: "GitHub" } } },
      //           description: { type: "object", properties: { es: { type: "string", example: "Descripcion corta" }, en: { type: "string", example: "Short description" } } },
      //           value: { example: "https://github.com/EleazarGamezD" },
      //           icon: { nullable: true, example: "fa-brands fa-github" },
      //           href: { type: "string", example: "https://github.com/EleazarGamezD" },
      //           order: { type: "integer", example: 1 },
      //           active: { type: "boolean", example: true },
      //           metadata: { type: "object", example: {} },
      //           fileName: { type: "string", example: "" },
      //           mimeType: { type: "string", example: "" },
      //           base64: { type: "string", example: "" }
      //         }
      //       }
      //     }
      //   }
      // }
      res.status(201).json(await createContentItem(resourceName, req.body as Record<string, unknown>));
    }),
  );

  contentRouter.patch(
    `/${resourceName}/:id`,
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      // #swagger.requestBody = {
      //   required: true,
      //   content: {
      //     "application/json": {
      //       schema: {
      //         type: "object",
      //         properties: {
      //           label: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
      //           title: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
      //           description: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } } },
      //           value: {},
      //           icon: { nullable: true },
      //           href: { type: "string" },
      //           order: { type: "integer" },
      //           active: { type: "boolean" },
      //           metadata: { type: "object" },
      //           fileName: { type: "string" },
      //           mimeType: { type: "string" },
      //           base64: { type: "string" }
      //         }
      //       }
      //     }
      //   }
      // }
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
    requireApiKey,
    asyncHandler(async (req, res) => {
      // #swagger.tags = ['Content']
      // #swagger.security = [{ "ApiKeyAuth": [] }]
      res.json(await deleteContentItem(resourceName, getSingleParam(req.params.id, 'id')));
    }),
  );
}
