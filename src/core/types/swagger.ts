import type { JsonObject } from '../interfaces/json.js';

export type SwaggerOperation = JsonObject;
export type SwaggerPathMap = Record<string, Record<string, SwaggerOperation>>;
export type SwaggerDocument = JsonObject & {
  paths?: SwaggerPathMap;
};