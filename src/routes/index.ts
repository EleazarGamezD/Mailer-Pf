import { Router } from 'express';

import { adminRouter } from './admin.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { contactRouter } from './contact.routes.js';
import { contentRouter } from './content.routes.js';
import { projectsRouter } from './projects.routes.js';
import { themesRouter } from './themes.routes.js';
import { translateRouter } from './translate.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/contact', contactRouter);
apiRoutes.use('/analytics', analyticsRouter);
apiRoutes.use('/admin', adminRouter);
apiRoutes.use('/projects', projectsRouter);
apiRoutes.use('/content', contentRouter);
apiRoutes.use('/themes', themesRouter);
apiRoutes.use('/translate', translateRouter);
