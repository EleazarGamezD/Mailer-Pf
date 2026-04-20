import type { ContentDocument, ProfileDocument } from '../../types/domain.js';

import { parseObjectId } from '../../utils/object-id.js';
import { createHttpError } from '../../utils/http-error.js';
import {
  buildSlugFromLocalizedTitle,
  getLocalizedField,
  resolveEnglishContent,
} from '../../utils/content.helpers.js';
import { ContentRepository, ProfileRepository } from './content.repository.js';

const collectionMap = {
  techSkills: new ContentRepository('tech_skills'),
  experience: new ContentRepository('experience'),
  socialLinks: new ContentRepository('social_links'),
  resumes: new ContentRepository('resumes'),
  testimonials: new ContentRepository('testimonials'),
};

const profileRepository = new ProfileRepository();

type ResourceName = keyof typeof collectionMap;

function getRepository(resourceName: ResourceName) {
  return collectionMap[resourceName];
}

function normalizeLocalizedContent(
  payload: Record<string, unknown>,
  defaults: Partial<ContentDocument> = {},
): Omit<ContentDocument, '_id' | 'createdAt' | 'updatedAt'> {
  const title = resolveEnglishContent(getLocalizedField(payload, 'title'));
  const description = resolveEnglishContent(getLocalizedField(payload, 'description'));
  const label = resolveEnglishContent(getLocalizedField(payload, 'label'));
  const slugSource = title.es || title.en ? title : label;

  return {
    key: typeof payload.key === 'string' ? payload.key.trim() : defaults.key,
    slug:
      typeof payload.slug === 'string' && payload.slug.trim()
        ? payload.slug.trim()
        : buildSlugFromLocalizedTitle(slugSource, defaults.slug || 'item'),
    title,
    description,
    label,
    value: payload.value ?? defaults.value ?? null,
    icon: payload.icon ?? defaults.icon ?? null,
    href: typeof payload.href === 'string' ? payload.href : defaults.href || '',
    order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
    active: typeof payload.active === 'boolean' ? payload.active : defaults.active ?? true,
    metadata:
      payload.metadata && typeof payload.metadata === 'object'
        ? (payload.metadata as Record<string, unknown>)
        : defaults.metadata || {},
    fileName: typeof payload.fileName === 'string' ? payload.fileName : defaults.fileName || '',
    mimeType: typeof payload.mimeType === 'string' ? payload.mimeType : defaults.mimeType || '',
    base64: typeof payload.base64 === 'string' ? payload.base64 : defaults.base64 || '',
  };
}

export async function listContent(resourceName: ResourceName) {
  return getRepository(resourceName).find({}, { sort: { order: 1, createdAt: -1 } });
}

export async function getProfile() {
  return profileRepository.findOne({ key: 'main-profile' }) || null;
}

export async function upsertProfile(payload: Record<string, unknown>) {
  const existing = await profileRepository.findOne({ key: 'main-profile' });
  const metadata =
    payload.metadata && typeof payload.metadata === 'object'
      ? (payload.metadata as Record<string, unknown>)
      : existing?.metadata || {};

  const base = {
    key: 'main-profile',
    slug: 'main-profile',
    title: resolveEnglishContent(getLocalizedField(payload, 'title')),
    description: resolveEnglishContent(getLocalizedField(payload, 'description')),
    label: resolveEnglishContent(getLocalizedField(payload, 'label')),
    availability: typeof payload.availability === 'string' ? payload.availability : '',
    location: typeof payload.location === 'string' ? payload.location : '',
    email: typeof payload.email === 'string' ? payload.email : '',
    phone: typeof payload.phone === 'string' ? payload.phone : '',
    metadata,
    updatedAt: new Date(),
  };

  if (!existing) {
    await profileRepository.create({
      ...base,
      createdAt: new Date(),
    } satisfies ProfileDocument);
  } else {
    await profileRepository.updateById(existing._id!, base);
  }

  return profileRepository.findOne({ key: 'main-profile' });
}

export async function createContentItem(resourceName: ResourceName, payload: Record<string, unknown>) {
  const repository = getRepository(resourceName);
  const document = {
    ...normalizeLocalizedContent(payload),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentDocument;

  await repository.create(document);
  return repository.findOne({ slug: document.slug });
}

export async function updateContentItem(
  resourceName: ResourceName,
  id: string,
  payload: Record<string, unknown>,
) {
  const repository = getRepository(resourceName);
  const objectId = parseObjectId(id);
  const existing = await repository.findOne({ _id: objectId });

  if (!existing) {
    throw createHttpError(404, 'Content item not found.');
  }

  const updated = await repository.updateById(objectId, {
    ...normalizeLocalizedContent(payload, existing),
    updatedAt: new Date(),
  });

  return updated;
}

export async function deleteContentItem(resourceName: ResourceName, id: string) {
  const repository = getRepository(resourceName);
  const result = await repository.deleteById(parseObjectId(id));

  if (!result.deletedCount) {
    throw createHttpError(404, 'Content item not found.');
  }

  return { deleted: true };
}
