import type { JsonValue } from './json.js';

export interface HttpError extends Error {
  statusCode?: number;
  details?: JsonValue;
}