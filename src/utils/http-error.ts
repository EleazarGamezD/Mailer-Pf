import type { JsonValue } from '../core/interfaces/json.js';

export interface HttpError extends Error {
  statusCode?: number;
  details?: JsonValue;
}

export function createHttpError(statusCode: number, message: string, details?: JsonValue): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
