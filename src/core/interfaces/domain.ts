import type { Document, ObjectId } from 'mongodb';
import type { StoredFileDocument } from './image.js';
import type { JsonObject, JsonValue } from './json.js';

export interface LocalizedText {
  es: string;
  en: string;
}

export interface BaseEntity extends Document {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredFileEntity extends Document, StoredFileDocument {
  _id?: ObjectId;
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
  status: string;
  publishedAt: string | null;
}

export interface ContentDocument extends BaseEntity {
  key?: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
  value: JsonValue;
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
  key: string;
  slug: string;
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
  type: string;
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
  role: 'super_admin' | 'admin' | 'editor';
  active: boolean;
  lastLoginAt: Date | null;
}
