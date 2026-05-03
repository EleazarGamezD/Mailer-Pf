import type { ContentDocument, ProjectDocument } from '../interfaces/domain.js';

export type ProjectSlugExistsHandler = (slug: string) => Promise<ProjectDocument | null>;
export type SkillFinder = (slug: string) => Promise<ContentDocument | null>;