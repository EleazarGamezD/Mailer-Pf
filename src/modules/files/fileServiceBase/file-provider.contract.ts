import type { FileBinaryPayload, FileStorageMode } from '../../../core/interfaces/files.js';

export interface FileProviderContract {
  readonly storageMode: FileStorageMode;
  uploadFile(payload: FileBinaryPayload): Promise<string>;
  getFileUrl(fileName: string): Promise<string | null>;
  deleteFile(fileName: string): Promise<boolean>;
}
