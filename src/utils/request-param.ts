import { createHttpError } from './http-error.js';

export function getSingleParam(value: string | string[] | undefined, fieldName: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  throw createHttpError(400, `Invalid ${fieldName} route parameter.`);
}
