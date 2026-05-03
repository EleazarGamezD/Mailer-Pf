import { ContentResourceEnum } from '../enums/content-resource.enum.js';

export type ContentResourceName = ContentResourceEnum;

export const contentResourceValues = Object.values(ContentResourceEnum) as ContentResourceEnum[];