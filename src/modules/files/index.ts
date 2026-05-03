import { env } from '../../config/env.js';
import { FileStorageModeEnum } from '../../core/enums/file-storage-mode.enum.js';

import { FileDatabaseService } from './FileServerDatabase/fileDatabase.service.js';
import { FileBucketService } from './FileServiceBucket/fileBucket.service.js';

export const databaseFileService = new FileDatabaseService();

export const fileService = (() => {
  if (env.fileStorageMode !== FileStorageModeEnum.BUCKET) {
    return databaseFileService;
  }

  try {
    return new FileBucketService();
  } catch (error) {
    console.error('Bucket file storage initialization failed. Falling back to DB storage.', error);
    return databaseFileService;
  }
})();
