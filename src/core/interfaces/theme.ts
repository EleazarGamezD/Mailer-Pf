import type { ObjectId } from 'mongodb';

export interface ThemeColors {
  baseColor: string;
  veryLightGray: string;
  darkGray: string;
  mediumGray: string;
  lightMediumGray: string;
  altFont: string;
  primaryFont: string;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  baseColor: '#c84b31',
  veryLightGray: '#ecf0f1',
  darkGray: '#2e4052',
  mediumGray: '#7f8c8d',
  lightMediumGray: '#bdc3c7',
  altFont: '"Rufina", serif',
  primaryFont: '"Jost", sans-serif',
};

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
