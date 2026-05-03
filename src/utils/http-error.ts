import type { JsonValue } from '../core/interfaces/json.js';
import type { HttpError } from '../core/interfaces/error.js';

export type { HttpError } from '../core/interfaces/error.js';

export function createHttpError(statusCode: number, message: string, details?: JsonValue): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
