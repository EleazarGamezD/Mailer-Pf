import { AdminRoleEnum } from '../enums/admin-role.enum.js';
import { AnalyticsEventTypeEnum } from '../enums/analytics-event-type.enum.js';
import { ProjectStatusEnum } from '../enums/project-status.enum.js';
import type { JsonObject, JsonValue } from './json.js';
import type { ImageUploadContract, StoredImageAsset } from './image.js';
import type { ExperiencePeriod, LocalizedText } from './domain.js';

export type ImageReferenceInput = string | ImageUploadContract | StoredImageAsset | null;
export type ImageReferenceCollectionInput = ImageReferenceInput[];

export interface ProjectPayload extends JsonObject {
  slug?: string;
  title?: Partial<LocalizedText>;
  summary?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  stack?: string[];
  skillIds?: string[];
  primarySkillId?: string | null;
  images?: ImageReferenceCollectionInput;
  coverImage?: ImageReferenceInput;
  projectLink?: string;
  codeLink?: string;
  featured?: boolean;
  status?: ProjectStatusEnum;
  publishedAt?: string | null;
}

export interface ProjectListQuery extends JsonObject {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentListQuery extends JsonObject {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentPayload extends JsonObject {
  key?: string;
  slug?: string;
  title?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  label?: Partial<LocalizedText>;
  value?: JsonValue;
  name?: string;
  position?: string;
  company?: string;
  language?: string;
  period?: Partial<ExperiencePeriod>;
  icon?: string | ImageUploadContract | StoredImageAsset | null;
  href?: string;
  order?: number | string;
  active?: boolean;
  metadata?: JsonObject;
  fileName?: string;
  mimeType?: string;
  base64?: string;
}

export interface ProfilePayload extends JsonObject {
  title?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  label?: Partial<LocalizedText>;
  availability?: string;
  location?: string;
  email?: string;
  phone?: string;
  metadata?: JsonObject;
}

export interface CreateAdminUserPayload extends JsonObject {
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
  role?: AdminRoleEnum;
}

export interface LoginAdminUserPayload extends JsonObject {
  email?: string;
  login?: string;
  password?: string;
}

export interface UpdateAdminUserPayload extends JsonObject {
  displayName?: string;
  role?: AdminRoleEnum;
  active?: boolean;
}

export interface AnalyticsEventPayload extends JsonObject {
  type?: AnalyticsEventTypeEnum;
  path?: string;
  projectId?: string | null;
  language?: string;
  sessionId?: string | null;
  meta?: JsonObject;
}

export interface AnalyticsFiltersPayload extends JsonObject {
  from?: string;
  to?: string;
  year?: string | number;
  month?: string | number;
  day?: string | number;
}

export interface ContactPayload extends JsonObject {
  subject?: string;
  message?: string;
  contactEmail?: string;
  name?: string;
  phone?: string;
}

export interface CaptchaPayload extends JsonObject {
  token?: string;
}
