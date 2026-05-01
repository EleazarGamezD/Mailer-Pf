import { env } from '../../config/env.js';
import { FileStorageModeEnum } from '../../core/enums/file-storage-mode.enum.js';

import { FileDatabaseService } from './FileServerDatabase/fileDatabase.service.js';
import { FileBucketService } from './FileServiceBucket/fileBucket.service.js';

export const databaseFileService = new FileDatabaseService();
export const fileService =
  env.fileStorageMode === FileStorageModeEnum.BUCKET ? new FileBucketService() : databaseFileService;
