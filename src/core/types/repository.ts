import type { ObjectId } from 'mongodb';

export type RepositoryDocumentId = ObjectId | string | number | bigint | boolean | Date | Uint8Array;