import { FileStorageModeEnum } from '../enums/file-storage-mode.enum.js';
import type { JsonObject } from './json.js';

export interface ImageUploadContract extends JsonObject {
  id?: string;
  name?: string;
  file: string;
  extension?: string;
}

export interface StoredImageAsset extends JsonObject {
  id?: string;
  name?: string;
  storage?: FileStorageModeEnum;
  fileName: string;
  extension?: string;
  url?: string;
}
