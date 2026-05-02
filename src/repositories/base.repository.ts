import type { Filter, ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import type { IPaginationOptions, IPaginationResponse } from '../core/interfaces/common.interface.js';

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

  async findPaginated(
    filter: Filter<TSchema> = {},
    options: Parameters<typeof this.collection.find>[1] = {},
    paginationOptions: IPaginationOptions = {},
  ): Promise<IPaginationResponse<TSchema>> {
    const currentPage = Number.isFinite(paginationOptions.page) ? Math.max(1, Math.trunc(paginationOptions.page as number)) : 1;
    const limit = Number.isFinite(paginationOptions.limit) ? Math.max(1, Math.trunc(paginationOptions.limit as number)) : 10;
    const skip = (currentPage - 1) * limit;

    const [data, totalItems] = await Promise.all([
      this.collection.find(filter, { ...options, skip, limit }).toArray() as Promise<TSchema[]>,
      this.collection.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1 && totalPages > 0,
    };
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
