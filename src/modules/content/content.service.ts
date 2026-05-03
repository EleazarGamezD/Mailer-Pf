import type { IPaginationOptions, IPaginationResponse } from '../../core/interfaces/common.interface.js';
import type { ContentDocument, ExperiencePeriod, ProfileDocument } from '../../core/interfaces/domain.js';
import type { ContentPayload, ProfilePayload } from '../../core/interfaces/requests.js';
import { isJsonObject } from '../../core/interfaces/json.js';

import {
  buildSlugFromLocalizedTitle,
  getLocalizedField,
  resolveEnglishContent,
} from '../../utils/content.helpers.js';
import { createHttpError } from '../../utils/http-error.js';
import { parseObjectId } from '../../utils/object-id.js';
import { buildUniqueTechSkillSlug, normalizeTechSkillLabel } from '../../utils/skill.helpers.js';
import { fileService } from '../files/index.js';
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

function formatExperiencePeriod(period: ExperiencePeriod | null | undefined) {
  if (!period?.start) {
    return '';
  }

  if (period.current || !period.end) {
    return `${period.start} - Actual`;
  }

  return `${period.start} - ${period.end}`;
}

function parseLegacyExperiencePeriod(value: unknown): ExperiencePeriod | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const [rawStart, rawEnd] = normalized.split(/\s*-\s*/u);
  const start = rawStart?.trim();
  const end = rawEnd?.trim();

  if (!start) {
    return undefined;
  }

  if (!end || /^actual$/iu.test(end)) {
    return {
      start,
      end: null,
      current: true,
    };
  }

  return {
    start,
    end,
    current: false,
  };
}

function normalizeExperiencePeriod(
  payloadPeriod: unknown,
  defaultPeriod: ExperiencePeriod | undefined,
  legacyValue?: unknown,
) {
  if (typeof payloadPeriod === 'object' && payloadPeriod !== null && !Array.isArray(payloadPeriod)) {
    const typedPeriod = payloadPeriod as Partial<ExperiencePeriod>;
    const start = typeof typedPeriod.start === 'string' ? typedPeriod.start.trim() : '';
    const rawEnd = typeof typedPeriod.end === 'string' ? typedPeriod.end.trim() : '';
    const current = typedPeriod.current === true || rawEnd === '';

    if (start) {
      return {
        start,
        end: current ? null : rawEnd || null,
        current,
      } satisfies ExperiencePeriod;
    }
  }

  return defaultPeriod ?? parseLegacyExperiencePeriod(legacyValue);
}

function getResumeFileExtension(fileName: string, mimeType: string) {
  const normalizedFileName = fileName.trim();
  const extensionMatch = normalizedFileName.match(/\.([a-z0-9]+)$/iu);

  if (extensionMatch?.[1]) {
    return extensionMatch[1].toLowerCase();
  }

  switch (mimeType.trim().toLowerCase()) {
    case 'application/msword':
      return 'doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'application/pdf':
    default:
      return 'pdf';
  }
}

function buildResumeDownloadFileName(
  label: ReturnType<typeof resolveEnglishContent>,
  title: ReturnType<typeof resolveEnglishContent>,
  fileName: string,
  mimeType: string,
) {
  const source = label.es || label.en || title.es || title.en || 'resume';
  const safeBaseName = source
    .replace(/[\\/:*?"<>|]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  return `${safeBaseName || 'resume'}.${getResumeFileExtension(fileName, mimeType)}`;
}

async function resolveContentItem(resourceName: ResourceName, item: ContentDocument | null) {
  if (!item) {
    return null;
  }

  if (resourceName === 'experience') {
    const period = normalizeExperiencePeriod(item.period, item.period, item.value ?? item.metadata?.year);

    return {
      ...item,
      period,
      value: formatExperiencePeriod(period) || item.value,
    };
  }

  if (resourceName !== 'techSkills') {
    return item;
  }

  const resolvedIcon = typeof item.icon === 'string' ? await fileService.resolveImageAsset(item.icon) : null;

  return {
    ...item,
    icon:
      resolvedIcon == null
        ? null
        : typeof resolvedIcon === 'string'
          ? resolvedIcon
          : resolvedIcon.url ?? null,
  };
}

async function resolveProfileDocument(profile: ProfileDocument | null) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    metadata: await fileService.resolveProfileMetadata(profile.metadata),
  };
}

async function normalizeLocalizedContent(
  resourceName: ResourceName,
  payload: ContentPayload,
  defaults: Partial<ContentDocument> = {},
): Promise<Omit<ContentDocument, '_id' | 'createdAt' | 'updatedAt'>> {
  if (resourceName === 'techSkills') {
    const rawLabel =
      getLocalizedField(payload, 'label').es ||
      getLocalizedField(payload, 'label').en ||
      getLocalizedField(payload, 'title').es ||
      getLocalizedField(payload, 'title').en ||
      (typeof payload.value === 'string' ? payload.value.trim() : '');

    if (!rawLabel) {
      throw createHttpError(400, 'Skill label is required.');
    }

    const label = normalizeTechSkillLabel(rawLabel);
    const slug = await buildUniqueTechSkillSlug(
      label,
      async (candidate) => getRepository(resourceName).findOne({ slug: candidate }),
      defaults._id ? String(defaults._id) : undefined,
    );

    return {
      key: typeof payload.key === 'string' ? payload.key.trim() : defaults.key,
      slug,
      title: label,
      description: { es: '', en: '' },
      label,
      value: label.es,
      icon: await fileService.normalizeImageAsset(payload.icon ?? null, 'techSkills.icon'),
      href: '',
      order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
      active: typeof payload.active === 'boolean' ? payload.active : defaults.active ?? true,
      metadata: isJsonObject(payload.metadata) ? payload.metadata : defaults.metadata || {},
      fileName: '',
      mimeType: '',
      base64: '',
    };
  }

  const title = resolveEnglishContent(getLocalizedField(payload, 'title'));
  const description = resolveEnglishContent(getLocalizedField(payload, 'description'));
  const label = resolveEnglishContent(getLocalizedField(payload, 'label'));
  const slugSource = title.es || title.en ? title : label;
  const mimeType =
    typeof payload.mimeType === 'string' && payload.mimeType.trim()
      ? payload.mimeType.trim()
      : defaults.mimeType || '';
  const rawFileName =
    typeof payload.fileName === 'string' && payload.fileName.trim()
      ? payload.fileName.trim()
      : defaults.fileName || '';

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
    period:
      resourceName === 'experience'
        ? normalizeExperiencePeriod(payload.period, defaults.period, payload.value ?? defaults.value ?? defaults.metadata?.year)
        : defaults.period,
    icon: payload.icon ?? defaults.icon ?? null,
    href: typeof payload.href === 'string' ? payload.href : defaults.href || '',
    order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
    active: resourceName === 'resumes' ? true : typeof payload.active === 'boolean' ? payload.active : defaults.active ?? true,
    metadata: isJsonObject(payload.metadata) ? payload.metadata : defaults.metadata || {},
    fileName:
      resourceName === 'resumes'
        ? buildResumeDownloadFileName(label, title, rawFileName, mimeType)
        : rawFileName,
    mimeType,
    base64: typeof payload.base64 === 'string' ? payload.base64 : defaults.base64 || '',
  };
}

export async function listContent(resourceName: ResourceName) {
  const items = await getRepository(resourceName).find({}, { sort: { order: 1, createdAt: -1 } });
  return Promise.all(items.map((item) => resolveContentItem(resourceName, item)));
}

export async function listContentPaginated(
  resourceName: ResourceName,
  paginationOptions: IPaginationOptions = {},
): Promise<IPaginationResponse<NonNullable<Awaited<ReturnType<typeof resolveContentItem>>>>> {
  const paginatedItems = await getRepository(resourceName).findPaginated(
    {},
    { sort: { order: 1, createdAt: -1 } },
    paginationOptions,
  );

  return {
    ...paginatedItems,
    data: (await Promise.all(paginatedItems.data.map((item) => resolveContentItem(resourceName, item)))).filter(
      (item): item is NonNullable<Awaited<ReturnType<typeof resolveContentItem>>> => item !== null,
    ),
  };
}

export async function getProfile() {
  return resolveProfileDocument(await profileRepository.findOne({ key: 'main-profile' }));
}

export async function upsertProfile(payload: ProfilePayload) {
  const existing = await profileRepository.findOne({ key: 'main-profile' });
  const rawMetadata = isJsonObject(payload.metadata) ? payload.metadata : existing?.metadata || {};
  const metadata = await fileService.storeProfileMetadata(rawMetadata);

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

  return resolveProfileDocument(await profileRepository.findOne({ key: 'main-profile' }));
}

export async function createContentItem(resourceName: ResourceName, payload: ContentPayload) {
  const repository = getRepository(resourceName);
  const normalizedDocument = await normalizeLocalizedContent(resourceName, payload);
  const document = {
    ...normalizedDocument,
    value:
      resourceName === 'experience'
        ? formatExperiencePeriod(normalizedDocument.period ?? null)
        : normalizedDocument.value,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentDocument;

  await repository.create(document);
  return resolveContentItem(resourceName, await repository.findOne({ slug: document.slug }));
}

export async function updateContentItem(
  resourceName: ResourceName,
  id: string,
  payload: ContentPayload,
) {
  const repository = getRepository(resourceName);
  const objectId = parseObjectId(id);
  const existing = await repository.findOne({ _id: objectId });

  if (!existing) {
    throw createHttpError(404, 'Content item not found.');
  }

  const normalizedDocument = await normalizeLocalizedContent(resourceName, payload, existing);
  const updated = await repository.updateById(objectId, {
    ...normalizedDocument,
    value:
      resourceName === 'experience'
        ? formatExperiencePeriod(normalizedDocument.period ?? null)
        : normalizedDocument.value,
    updatedAt: new Date(),
  });

  return resolveContentItem(resourceName, updated);
}

export async function deleteContentItem(resourceName: ResourceName, id: string) {
  const repository = getRepository(resourceName);
  const result = await repository.deleteById(parseObjectId(id));

  if (!result.deletedCount) {
    throw createHttpError(404, 'Content item not found.');
  }

  return { deleted: true };
}
