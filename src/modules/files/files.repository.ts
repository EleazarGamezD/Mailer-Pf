import type { DeleteResult } from 'mongodb';

import type { StoredFileEntity } from '../../core/interfaces/domain.js';
import { BaseRepository } from '../../repositories/base.repository.js';

export class FilesRepository extends BaseRepository<StoredFileEntity> {
  constructor() {
    super('files');
  }

  findByFileName(fileName: string) {
    return this.findOne({ fileName });
  }

  deleteByFileName(fileName: string): Promise<DeleteResult> {
    return this.collection.deleteOne({ fileName });
  }
}
