import type { ProjectDocument } from '../../core/interfaces/domain.js';
import type { StoredImageAsset } from '../../core/interfaces/image.js';
import type { ProjectPayload } from '../../core/interfaces/requests.js';

import {
  buildSlugFromLocalizedTitle,
  getLocalizedField,
  resolveEnglishContent,
} from '../../utils/content.helpers.js';
import { createHttpError } from '../../utils/http-error.js';
import { parseObjectId } from '../../utils/object-id.js';
import { fileService } from '../files/index.js';
import { ProjectsRepository } from './projects.repository.js';

const projectsRepository = new ProjectsRepository();

async function normalizeProjectPayload(
  payload: ProjectPayload,
): Promise<Omit<ProjectDocument, '_id' | 'createdAt' | 'updatedAt'>> {
  const title = resolveEnglishContent(getLocalizedField(payload, 'title'));
  const summary = resolveEnglishContent(getLocalizedField(payload, 'summary'));
  const description = resolveEnglishContent(getLocalizedField(payload, 'description'));

  if (!title.es && !title.en) {
    throw createHttpError(400, 'Project title is required.');
  }

  return {
    slug:
      typeof payload.slug === 'string' && payload.slug.trim()
        ? payload.slug.trim()
        : buildSlugFromLocalizedTitle(title, 'project'),
    title,
    summary,
    description,
    stack: Array.isArray(payload.stack) ? payload.stack.filter((value): value is string => typeof value === 'string') : [],
    images: await fileService.normalizeImageCollection(payload.images, 'project images'),
    coverImage: await fileService.normalizeImageAsset(payload.coverImage, 'project cover image'),
    projectLink: typeof payload.projectLink === 'string' ? payload.projectLink : '',
    codeLink: typeof payload.codeLink === 'string' ? payload.codeLink : '',
    featured: Boolean(payload.featured),
    status: typeof payload.status === 'string' ? payload.status : 'draft',
    publishedAt: typeof payload.publishedAt === 'string' ? payload.publishedAt : null,
  };
}

async function resolveProjectAssets(project: ProjectDocument) {
  return {
    ...project,
    images: (await Promise.all(project.images.map((image) => fileService.resolveImageAsset(image)))).filter(
      (image): image is string | StoredImageAsset => image !== null,
    ),
    coverImage: await fileService.resolveImageAsset(project.coverImage),
  };
}

export async function listProjects() {
  const projects = await projectsRepository.find({}, { sort: { createdAt: -1 } });
  return Promise.all(projects.map((project) => resolveProjectAssets(project)));
}

export async function getProjectByIdOrSlug(idOrSlug: string) {
  const project = await projectsRepository.findOne(
    /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: parseObjectId(idOrSlug) } : { slug: idOrSlug },
  );

  if (!project) {
    throw createHttpError(404, 'Project not found.');
  }

  return resolveProjectAssets(project);
}

export async function createProject(payload: ProjectPayload) {
  const document = {
    ...(await normalizeProjectPayload(payload)),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProjectDocument;

  await projectsRepository.create(document);
  return getProjectByIdOrSlug(document.slug);
}

export async function updateProject(id: string, payload: ProjectPayload) {
  const project = await projectsRepository.updateById(parseObjectId(id), {
    ...(await normalizeProjectPayload(payload)),
    updatedAt: new Date(),
  });

  if (!project) {
    throw createHttpError(404, 'Project not found.');
  }

  return resolveProjectAssets(project);
}

export async function deleteProject(id: string) {
  const result = await projectsRepository.deleteById(parseObjectId(id));

  if (!result.deletedCount) {
    throw createHttpError(404, 'Project not found.');
  }

  return { deleted: true };
}
