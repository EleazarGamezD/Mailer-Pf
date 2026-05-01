import type { JsonObject, JsonValue } from './json.js';
import type { ImageUploadContract, StoredImageAsset } from './image.js';
import type { LocalizedText } from './domain.js';

export type ImageReferenceInput = string | ImageUploadContract | StoredImageAsset | null;
export type ImageReferenceCollectionInput = ImageReferenceInput[];

export interface ProjectPayload extends JsonObject {
  slug?: string;
  title?: Partial<LocalizedText>;
  summary?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  stack?: string[];
  images?: ImageReferenceCollectionInput;
  coverImage?: ImageReferenceInput;
  projectLink?: string;
  codeLink?: string;
  featured?: boolean;
  status?: string;
  publishedAt?: string | null;
}

export interface ContentPayload extends JsonObject {
  key?: string;
  slug?: string;
  title?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  label?: Partial<LocalizedText>;
  value?: JsonValue;
  icon?: JsonValue | null;
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
  role?: string;
}

export interface LoginAdminUserPayload extends JsonObject {
  email?: string;
  login?: string;
  password?: string;
}

export interface UpdateAdminUserPayload extends JsonObject {
  displayName?: string;
  role?: string;
  active?: boolean;
}

export interface AnalyticsEventPayload extends JsonObject {
  type?: string;
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
