import type { IPaginationOptions, IPaginationResponse } from '../../core/interfaces/common.interface.js';
import { ContentCollectionEnum } from '../../core/enums/content-collection.enum.js';
import { ContentResourceEnum } from '../../core/enums/content-resource.enum.js';
import { ProfileKeyEnum } from '../../core/enums/profile-key.enum.js';
import type { ContentDocument, ExperiencePeriod, ProfileDocument } from '../../core/interfaces/domain.js';
import type { ContentPayload, ProfilePayload } from '../../core/interfaces/requests.js';
import type { ContentResourceName } from '../../core/types/content.js';
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

const RESUME_FILE_METADATA_KEY = 'resumeFile';
const RESUME_BUCKET_FOLDER = 'resumes';
const RESUME_STORAGE_OPERATION_TIMEOUT_MS = 3500;

const collectionMap = {
  [ContentResourceEnum.TECH_SKILLS]: new ContentRepository(ContentCollectionEnum.TECH_SKILLS),
  [ContentResourceEnum.EXPERIENCE]: new ContentRepository(ContentCollectionEnum.EXPERIENCE),
  [ContentResourceEnum.EDUCATION]: new ContentRepository(ContentCollectionEnum.EDUCATION),
  [ContentResourceEnum.CERTIFICATIONS]: new ContentRepository(ContentCollectionEnum.CERTIFICATIONS),
  [ContentResourceEnum.SOCIAL_LINKS]: new ContentRepository(ContentCollectionEnum.SOCIAL_LINKS),
  [ContentResourceEnum.RESUMES]: new ContentRepository(ContentCollectionEnum.RESUMES),
  [ContentResourceEnum.TESTIMONIALS]: new ContentRepository(ContentCollectionEnum.TESTIMONIALS),
};

const profileRepository = new ProfileRepository();

function getRepository(resourceName: ContentResourceName) {
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

function getMetadataString(metadata: ContentDocument['metadata'] | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : '';
}

function getResumeStoredFileName(metadata: ContentDocument['metadata'] | undefined) {
  const value = metadata?.[RESUME_FILE_METADATA_KEY];

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (isJsonObject(value) && typeof value.fileName === 'string' && value.fileName.trim()) {
    return value.fileName.trim();
  }

  return null;
}

function parseUploadedBinary(rawValue: string) {
  const trimmed = rawValue.trim();
  const match = /^data:(?<mime>[^;]+);base64,(?<base64>.+)$/u.exec(trimmed);

  if (match?.groups?.base64) {
    return {
      mimeType: match.groups.mime,
      base64: match.groups.base64,
    };
  }

  return {
    mimeType: null,
    base64: trimmed,
  };
}

async function deleteStoredResumeFile(fileName: string | null) {
  if (!fileName) {
    return;
  }

  try {
    await fileService.deleteFile(fileName);
  } catch (error) {
    console.warn(`[content] Failed to delete stored resume file "${fileName}".`, error);
  }
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function uploadResumeBase64ToStorage(base64: string, fileName: string, mimeType: string) {
  const parsedBinary = parseUploadedBinary(base64);
  const effectiveMimeType = parsedBinary.mimeType || mimeType || 'application/octet-stream';
  const extension = getResumeFileExtension(fileName, effectiveMimeType);

  return fileService.uploadFile({
    name: fileName || `resume.${extension}`,
    originalName: fileName || `resume.${extension}`,
    folder: RESUME_BUCKET_FOLDER,
    extension,
    mimeType: effectiveMimeType,
    base64: parsedBinary.base64,
    buffer: Buffer.from(parsedBinary.base64, 'base64'),
    size: Buffer.byteLength(parsedBinary.base64, 'base64'),
  });
}

async function safelyMigrateLegacyResumeBase64(item: ContentDocument) {
  try {
    return await withTimeout(
      migrateLegacyResumeBase64(item),
      RESUME_STORAGE_OPERATION_TIMEOUT_MS,
      `[content] Resume legacy migration timed out for "${item.slug || item._id}".`,
    );
  } catch (error) {
    console.warn(`[content] Resume legacy migration skipped for "${item.slug || item._id}".`, error);
    return item;
  }
}

async function safelyGetResumeDownloadUrl(fileName: string, originalFileName?: string) {
  try {
    return await withTimeout(
      fileService.getDownloadUrl(fileName, originalFileName),
      RESUME_STORAGE_OPERATION_TIMEOUT_MS,
      `[content] Resume signed URL timed out for "${fileName}".`,
    );
  } catch (error) {
    console.warn(`[content] Resume signed URL unavailable for "${fileName}".`, error);
    return null;
  }
}

async function migrateLegacyResumeBase64(item: ContentDocument) {
  const legacyResumeBase64 = typeof item.base64 === 'string' ? item.base64.trim() : '';
  if (!legacyResumeBase64 || getResumeStoredFileName(item.metadata)) {
    return item;
  }

  const storedResumeFile = await uploadResumeBase64ToStorage(legacyResumeBase64, item.fileName, item.mimeType);
  const updated = await getRepository(ContentResourceEnum.RESUMES).updateById(item._id!, {
    metadata: {
      ...item.metadata,
      originalName: getMetadataString(item.metadata, 'originalName') || item.fileName,
      [RESUME_FILE_METADATA_KEY]: storedResumeFile,
    },
    base64: '',
    updatedAt: new Date(),
  });

  return updated ?? {
    ...item,
    metadata: {
      ...item.metadata,
      originalName: getMetadataString(item.metadata, 'originalName') || item.fileName,
      [RESUME_FILE_METADATA_KEY]: storedResumeFile,
    },
    base64: '',
  };
}

async function resolveContentItem(resourceName: ContentResourceName, item: ContentDocument | null) {
  if (!item) {
    return null;
  }

  if (resourceName === ContentResourceEnum.EXPERIENCE || resourceName === ContentResourceEnum.EDUCATION) {
    const period = normalizeExperiencePeriod(item.period, item.period, item.value ?? item.metadata?.year);

    return {
      ...item,
      period,
      value: formatExperiencePeriod(period) || item.value,
    };
  }

  if (resourceName === ContentResourceEnum.TESTIMONIALS) {
    return {
      ...item,
      name: getMetadataString(item.metadata, 'name') || item.label?.es || item.label?.en || '',
      position: getMetadataString(item.metadata, 'position'),
      company: getMetadataString(item.metadata, 'company'),
    };
  }

  if (resourceName === ContentResourceEnum.RESUMES) {
    const resolvedItem = await safelyMigrateLegacyResumeBase64(item);
    const storedResumeFileName = getResumeStoredFileName(resolvedItem.metadata);
    const originalFileName = getMetadataString(resolvedItem.metadata, 'originalName') || resolvedItem.fileName || undefined;
    const downloadUrl = storedResumeFileName
      ? await safelyGetResumeDownloadUrl(storedResumeFileName, originalFileName)
      : null;

    return {
      ...resolvedItem,
      language: getMetadataString(resolvedItem.metadata, 'language'),
      href: downloadUrl ?? resolvedItem.href,
      base64: '',
    };
  }

  if (resourceName !== ContentResourceEnum.TECH_SKILLS) {
    return item;
  }

  const resolvedIcon = typeof item.icon === 'string' ? await fileService.resolveImageAsset(item.icon) : null;

  return {
    ...item,
    icon: resolvedIcon,
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
  resourceName: ContentResourceName,
  payload: ContentPayload,
  defaults: Partial<ContentDocument> = {},
): Promise<Omit<ContentDocument, '_id' | 'createdAt' | 'updatedAt'>> {
  if (resourceName === ContentResourceEnum.TECH_SKILLS) {
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
      icon: await fileService.normalizeImageAsset(payload.icon ?? null, `${ContentResourceEnum.TECH_SKILLS}.icon`),
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
  const normalizedMetadata = isJsonObject(payload.metadata) ? payload.metadata : defaults.metadata || {};

  if (resourceName === ContentResourceEnum.TESTIMONIALS) {
    const name =
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim()
        : getMetadataString(normalizedMetadata, 'name') || getMetadataString(defaults.metadata, 'name');
    const position =
      typeof payload.position === 'string' && payload.position.trim()
        ? payload.position.trim()
        : getMetadataString(normalizedMetadata, 'position') || getMetadataString(defaults.metadata, 'position');
    const company =
      typeof payload.company === 'string' && payload.company.trim()
        ? payload.company.trim()
        : getMetadataString(normalizedMetadata, 'company') || getMetadataString(defaults.metadata, 'company');

    return {
      key: typeof payload.key === 'string' ? payload.key.trim() : defaults.key,
      slug:
        typeof payload.slug === 'string' && payload.slug.trim()
          ? payload.slug.trim()
          : buildSlugFromLocalizedTitle(label.es || label.en ? label : title, defaults.slug || 'item'),
      title,
      description,
      label,
      value: payload.value ?? defaults.value ?? (name || null),
      period: defaults.period,
      icon: payload.icon ?? defaults.icon ?? null,
      href: typeof payload.href === 'string' ? payload.href : defaults.href || '',
      order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
      active: typeof payload.active === 'boolean' ? payload.active : defaults.active ?? true,
      metadata: {
        ...normalizedMetadata,
        name,
        position,
        company,
      },
      fileName: rawFileName,
      mimeType,
      base64: typeof payload.base64 === 'string' ? payload.base64 : defaults.base64 || '',
    };
  }

  if (resourceName === ContentResourceEnum.RESUMES) {
    const language =
      typeof payload.language === 'string' && payload.language.trim()
        ? payload.language.trim()
        : getMetadataString(normalizedMetadata, 'language') || getMetadataString(defaults.metadata, 'language');
    const previousStoredResumeFile = getResumeStoredFileName(defaults.metadata);
    const rawResumeBase64 = typeof payload.base64 === 'string' ? payload.base64.trim() : '';
    const legacyResumeBase64 = !previousStoredResumeFile && typeof defaults.base64 === 'string'
      ? defaults.base64.trim()
      : '';
    let storedResumeFile = previousStoredResumeFile;
    let persistedBase64 = '';

    if (rawResumeBase64 || legacyResumeBase64) {
      const uploadedFileName = await uploadResumeBase64ToStorage(rawResumeBase64 || legacyResumeBase64, rawFileName, mimeType);

      if (previousStoredResumeFile && previousStoredResumeFile !== uploadedFileName) {
        await deleteStoredResumeFile(previousStoredResumeFile);
      }

      storedResumeFile = uploadedFileName;
    }

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
      period: defaults.period,
      icon: payload.icon ?? defaults.icon ?? null,
      href: typeof payload.href === 'string' ? payload.href : defaults.href || '',
      order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
      active: true,
      metadata: {
        ...normalizedMetadata,
        language,
        [RESUME_FILE_METADATA_KEY]: storedResumeFile,
      },
      fileName: buildResumeDownloadFileName(label, title, rawFileName, mimeType),
      mimeType,
      base64: persistedBase64,
    };
  }

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
      resourceName === ContentResourceEnum.EXPERIENCE || resourceName === ContentResourceEnum.EDUCATION
        ? normalizeExperiencePeriod(payload.period, defaults.period, payload.value ?? defaults.value ?? defaults.metadata?.year)
        : defaults.period,
    icon: payload.icon ?? defaults.icon ?? null,
    href: typeof payload.href === 'string' ? payload.href : defaults.href || '',
    order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : defaults.order || 0,
    active: typeof payload.active === 'boolean' ? payload.active : defaults.active ?? true,
    metadata: normalizedMetadata,
    fileName: rawFileName,
    mimeType,
    base64: typeof payload.base64 === 'string' ? payload.base64 : defaults.base64 || '',
  };
}

export async function listContent(resourceName: ContentResourceName) {
  const items = await getRepository(resourceName).find({}, { sort: { order: 1, createdAt: -1 } });
  return (await Promise.all(items.map((item) => resolveContentItem(resourceName, item)))).filter(
    (item): item is NonNullable<Awaited<ReturnType<typeof resolveContentItem>>> => item !== null,
  );
}

export async function listContentPaginated(
  resourceName: ContentResourceName,
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
  return resolveProfileDocument(await profileRepository.findOne({ key: ProfileKeyEnum.MAIN_PROFILE }));
}

export async function upsertProfile(payload: ProfilePayload) {
  const existing = await profileRepository.findOne({ key: ProfileKeyEnum.MAIN_PROFILE });
  const rawMetadata = isJsonObject(payload.metadata) ? payload.metadata : existing?.metadata || {};
  const metadata = await fileService.storeProfileMetadata(rawMetadata);

  const base = {
    key: ProfileKeyEnum.MAIN_PROFILE,
    slug: ProfileKeyEnum.MAIN_PROFILE,
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

  return resolveProfileDocument(await profileRepository.findOne({ key: ProfileKeyEnum.MAIN_PROFILE }));
}

export async function createContentItem(resourceName: ContentResourceName, payload: ContentPayload) {
  const repository = getRepository(resourceName);
  const normalizedDocument = await normalizeLocalizedContent(resourceName, payload);
  const document = {
    ...normalizedDocument,
    value:
      resourceName === ContentResourceEnum.EXPERIENCE || resourceName === ContentResourceEnum.EDUCATION
        ? formatExperiencePeriod(normalizedDocument.period ?? null)
        : normalizedDocument.value,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentDocument;

  await repository.create(document);
  return resolveContentItem(resourceName, await repository.findOne({ slug: document.slug }));
}

export async function updateContentItem(
  resourceName: ContentResourceName,
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
      resourceName === ContentResourceEnum.EXPERIENCE || resourceName === ContentResourceEnum.EDUCATION
        ? formatExperiencePeriod(normalizedDocument.period ?? null)
        : normalizedDocument.value,
    updatedAt: new Date(),
  });

  return resolveContentItem(resourceName, updated);
}

export async function deleteContentItem(resourceName: ContentResourceName, id: string) {
  const repository = getRepository(resourceName);
  const objectId = parseObjectId(id);
  const existing = resourceName === ContentResourceEnum.RESUMES
    ? await repository.findOne({ _id: objectId })
    : null;
  const result = await repository.deleteById(objectId);

  if (!result.deletedCount) {
    throw createHttpError(404, 'Content item not found.');
  }

  if (resourceName === ContentResourceEnum.RESUMES) {
    await deleteStoredResumeFile(getResumeStoredFileName(existing?.metadata));
  }

  return { deleted: true };
}
