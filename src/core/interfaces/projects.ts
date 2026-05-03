import type { ProjectDocument } from './domain.js';
import type { StoredImageAsset } from './image.js';

export interface ResolvedTechSkill {
  _id: string;
  slug: string;
  label: {
    es: string;
    en: string;
  };
  icon: string | null;
}

export interface ResolvedProjectDocument {
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