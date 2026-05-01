import type { Filter, ObjectId, OptionalUnlessRequiredId } from 'mongodb';

import { getDatabase } from '../config/db.js';

type RepositoryDocumentId = ObjectId | string | number | bigint | boolean | Date | Uint8Array;

export class BaseRepository<TSchema extends { _id?: RepositoryDocumentId }> {
  private readonly collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get collection() {
    return getDatabase().collection<TSchema>(this.collectionName);
  }

  find(filter: Filter<TSchema> = {}, options: Parameters<typeof this.collection.find>[1] = {}) {
    return this.collection.find(filter, options).toArray();
  }

  findOne(filter: Filter<TSchema>) {
    return this.collection.findOne(filter);
  }

  create(document: OptionalUnlessRequiredId<TSchema>) {
    return this.collection.insertOne(document);
  }

  updateById(id: NonNullable<TSchema['_id']>, update: Partial<TSchema>) {
    return this.collection.findOneAndUpdate(
      { _id: id } as Filter<TSchema>,
      { $set: update },
      { returnDocument: 'after', includeResultMetadata: false },
    );
  }

  deleteById(id: NonNullable<TSchema['_id']>) {
    return this.collection.deleteOne({ _id: id } as Filter<TSchema>);
  }
}
