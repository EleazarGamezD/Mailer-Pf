import type { Document, ObjectId } from 'mongodb';

export interface LocalizedText {
  es: string;
  en: string;
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
  images: unknown[];
  coverImage: unknown | null;
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
  value: unknown;
  icon: unknown | null;
  href: string;
  order: number;
  active: boolean;
  metadata: Record<string, unknown>;
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
}

export interface AnalyticsEventDocument extends Document {
  _id?: ObjectId;
  type: string;
  path: string;
  projectId: string | null;
  language: string;
  sessionId: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
}
