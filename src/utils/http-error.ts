export interface HttpError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function createHttpError(statusCode: number, message: string, details?: unknown): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
