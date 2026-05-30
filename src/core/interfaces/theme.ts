import type { ObjectId } from 'mongodb';

export interface ThemeColors {
  baseColor: string;
}

export interface ThemeDocument {
  _id?: ObjectId;
  name: string;
  active: boolean;
  colors: ThemeColors;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemePayload {
  name?: string;
  colors?: Partial<ThemeColors>;
}
