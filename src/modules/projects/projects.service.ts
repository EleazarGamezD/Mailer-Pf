import type { IPaginationOptions, IPaginationResponse } from '../../core/interfaces/common.interface.js';
import type { ContentDocument, ProjectDocument } from '../../core/interfaces/domain.js';
import type { StoredImageAsset } from '../../core/interfaces/image.js';
import type { ProjectPayload } from '../../core/interfaces/requests.js';

import {
  getLocalizedField,
  resolveEnglishContent,
} from '../../utils/content.helpers.js';
import { createHttpError } from '../../utils/http-error.js';
import { parseObjectId } from '../../utils/object-id.js';
import { buildUniqueProjectSlug } from '../../utils/project-slug.js';
import { ContentRepository } from '../content/content.repository.js';
import { fileService } from '../files/index.js';
import { ProjectsRepository } from './projects.repository.js';

const projectsRepository = new ProjectsRepository();
const techSkillsRepository = new ContentRepository('tech_skills');

interface ResolvedTechSkill {
  _id: string;
  slug: string;
  label: {
    es: string;
    en: string;
  };
  icon: string | null;
}

interface ResolvedProjectDocument {
  _id?: ProjectDocument['_id'];
  slug: string;
  title: ProjectDocument['title'];
  summary: ProjectDocument['summary'];
  description: ProjectDocument['description'];
  stack: string[];
  skillIds: string[];
  primarySkillId: string | null;
  skills: ResolvedTechSkill[];
  primarySkill: ResolvedTechSkill | null;
  images: Array<string | StoredImageAsset>;
  coverImage: string | StoredImageAsset | null;
  projectLink: string;
  codeLink: string;
  featured: boolean;
  status: string;
  publishedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function normalizeProjectPayload(
  payload: ProjectPayload,
  currentProject?: ProjectDocument,
): Promise<Omit<ProjectDocument, '_id' | 'createdAt' | 'updatedAt'>> {
  const title = resolveEnglishContent(getLocalizedField(payload, 'title'));
  const summary = resolveEnglishContent(getLocalizedField(payload, 'summary'));
  const description = resolveEnglishContent(getLocalizedField(payload, 'description'));

  if (!title.es && !title.en) {
    throw createHttpError(400, 'Project title is required.');
  }

  const resolvedSkills = await resolveSelectedSkills(payload.skillIds);
  const skillIds = resolvedSkills.map((skill) => String(skill._id));
  const primarySkillId = resolvePrimarySkillId(payload.primarySkillId, skillIds);

  return {
    slug: await buildUniqueProjectSlug(
      title,
      async (slug) => projectsRepository.findOne({ slug }),
      currentProject?._id ? String(currentProject._id) : undefined,
    ),
    title,
    summary,
    description,
    stack: resolvedSkills.map((skill) => skill.label.es || skill.label.en).filter(Boolean),
    skillIds,
    primarySkillId,
    images: await fileService.normalizeImageCollection(payload.images, 'project images'),
    coverImage: await fileService.normalizeImageAsset(payload.coverImage, 'project cover image'),
    projectLink: typeof payload.projectLink === 'string' ? payload.projectLink : '',
    codeLink: typeof payload.codeLink === 'string' ? payload.codeLink : '',
    featured: Boolean(payload.featured),
    status: typeof payload.status === 'string' ? payload.status : 'draft',
    publishedAt: typeof payload.publishedAt === 'string' ? payload.publishedAt : null,
  };
}

async function resolveProjectAssets(project: ProjectDocument): Promise<ResolvedProjectDocument> {
  const skills = await resolveProjectSkills(project.skillIds);
  const primarySkill = project.primarySkillId
    ? skills.find((skill) => skill._id === project.primarySkillId) ?? null
    : null;

  return {
    ...project,
    stack: skills.length
      ? skills.map((skill) => skill.label.es || skill.label.en)
      : project.stack,
    skills,
    primarySkillId: primarySkill?._id ?? null,
    primarySkill,
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

export async function listProjectsPaginated(
  paginationOptions: IPaginationOptions = {},
): Promise<IPaginationResponse<ResolvedProjectDocument>> {
  const paginatedProjects = await projectsRepository.findPaginated(
    {},
    { sort: { createdAt: -1 } },
    paginationOptions,
  );

  return {
    ...paginatedProjects,
    data: await Promise.all(paginatedProjects.data.map((project) => resolveProjectAssets(project))),
  };
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
  const currentProject = await projectsRepository.findOne({ _id: parseObjectId(id) });

  if (!currentProject) {
    throw createHttpError(404, 'Project not found.');
  }

  const project = await projectsRepository.updateById(parseObjectId(id), {
    ...(await normalizeProjectPayload(payload, currentProject)),
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

async function resolveSelectedSkills(skillIds: string[] | undefined): Promise<ContentDocument[]> {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    return [];
  }

  const normalizedIds = [...new Set(skillIds.filter((value): value is string => typeof value === 'string' && /^[a-f\d]{24}$/iu.test(value)))];
  if (normalizedIds.length === 0) {
    return [];
  }

  const objectIds = normalizedIds.map((id) => parseObjectId(id, 'skillId'));
  const skills = await techSkillsRepository.find(
    { _id: { $in: objectIds } },
    { sort: { order: 1, createdAt: -1 } },
  );

  const skillMap = new Map(skills.map((skill) => [String(skill._id), skill]));
  const orderedSkills: ContentDocument[] = [];

  for (const id of normalizedIds) {
    const skill = skillMap.get(id);
    if (skill) {
      orderedSkills.push(skill);
    }
  }

  return orderedSkills;
}

function resolvePrimarySkillId(primarySkillId: string | null | undefined, skillIds: string[]): string | null {
  if (!primarySkillId || !skillIds.includes(primarySkillId)) {
    return skillIds[0] ?? null;
  }

  return primarySkillId;
}

async function resolveProjectSkills(skillIds: string[]): Promise<ResolvedTechSkill[]> {
  const skills = await resolveSelectedSkills(skillIds);

  return Promise.all(
    skills.map(async (skill) => {
      const resolvedIcon = typeof skill.icon === 'string' ? await fileService.resolveImageAsset(skill.icon) : null;

      return {
        _id: String(skill._id),
        slug: skill.slug,
        label: skill.label,
        icon:
          resolvedIcon == null
            ? null
            : typeof resolvedIcon === 'string'
              ? resolvedIcon
              : resolvedIcon.url ?? null,
      };
    }),
  );
}
