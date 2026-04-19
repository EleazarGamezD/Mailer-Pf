import { ObjectId } from 'mongodb';

import { createHttpError } from './http-error.js';

export function parseObjectId(value: string, field = 'id'): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw createHttpError(400, `Invalid ${field} value.`);
  }

  return new ObjectId(value);
}
