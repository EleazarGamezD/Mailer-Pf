import type { Document, ObjectId } from 'mongodb';
import { AdminRoleEnum } from '../enums/admin-role.enum.js';
import { AnalyticsEventTypeEnum } from '../enums/analytics-event-type.enum.js';
import { ProfileKeyEnum } from '../enums/profile-key.enum.js';
import { ProjectStatusEnum } from '../enums/project-status.enum.js';
import type { JsonObject, JsonValue } from './json.js';

export interface LocalizedText {
  es: string;
  en: string;
}

export interface ExperiencePeriod {
  start: string;
  end: string | null;
  current: boolean;
}

export interface BaseEntity extends Document {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument extends BaseEntity {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  stack: string[];
  skillIds: string[];
  primarySkillId: string | null;
  images: string[];
  coverImage: string | null;
  projectLink: string;
  codeLink: string;
  featured: boolean;
  status: ProjectStatusEnum;
  publishedAt: string | null;
}

export interface ContentDocument extends BaseEntity {
  key?: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
  value: JsonValue;
  period?: ExperiencePeriod;
  icon: JsonValue | null;
  href: string;
  order: number;
  active: boolean;
  metadata: JsonObject;
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface ProfileDocument extends BaseEntity {
  key: ProfileKeyEnum;
  slug: ProfileKeyEnum;
  title: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
  availability: string;
  location: string;
  email: string;
  phone: string;
  metadata: JsonObject;
}

export interface AnalyticsEventDocument extends Document {
  _id?: ObjectId;
  type: AnalyticsEventTypeEnum;
  path: string;
  projectId: string | null;
  language: string;
  sessionId: string | null;
  meta: JsonObject;
  createdAt: Date;
}

export interface AdminUserDocument extends BaseEntity {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: AdminRoleEnum;
  active: boolean;
  lastLoginAt: Date | null;
}
