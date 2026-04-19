import type { ProjectDocument } from '../../types/domain.js';

import { parseObjectId } from '../../utils/object-id.js';
import { createHttpError } from '../../utils/http-error.js';
import {
  buildSlugFromLocalizedTitle,
  getLocalizedField,
  resolveEnglishContent,
} from '../../utils/content.helpers.js';
import { ProjectsRepository } from './projects.repository.js';

const projectsRepository = new ProjectsRepository();

function normalizeProjectPayload(payload: Record<string, unknown>): Omit<ProjectDocument, '_id' | 'createdAt' | 'updatedAt'> {
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
    images: Array.isArray(payload.images) ? payload.images : [],
    coverImage: payload.coverImage ?? null,
    projectLink: typeof payload.projectLink === 'string' ? payload.projectLink : '',
    codeLink: typeof payload.codeLink === 'string' ? payload.codeLink : '',
    featured: Boolean(payload.featured),
    status: typeof payload.status === 'string' ? payload.status : 'draft',
    publishedAt: typeof payload.publishedAt === 'string' ? payload.publishedAt : null,
  };
}

export async function listProjects() {
  return projectsRepository.find({}, { sort: { createdAt: -1 } });
}

export async function getProjectByIdOrSlug(idOrSlug: string) {
  const project = await projectsRepository.findOne(
    /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: parseObjectId(idOrSlug) } : { slug: idOrSlug },
  );

  if (!project) {
    throw createHttpError(404, 'Project not found.');
  }

  return project;
}

export async function createProject(payload: Record<string, unknown>) {
  const document = {
    ...normalizeProjectPayload(payload),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProjectDocument;

  await projectsRepository.create(document);
  return getProjectByIdOrSlug(document.slug);
}

export async function updateProject(id: string, payload: Record<string, unknown>) {
  const project = await projectsRepository.updateById(parseObjectId(id), {
    ...normalizeProjectPayload(payload),
    updatedAt: new Date(),
  });

  if (!project) {
    throw createHttpError(404, 'Project not found.');
  }

  return project;
}

export async function deleteProject(id: string) {
  const result = await projectsRepository.deleteById(parseObjectId(id));

  if (!result.deletedCount) {
    throw createHttpError(404, 'Project not found.');
  }

  return { deleted: true };
}
