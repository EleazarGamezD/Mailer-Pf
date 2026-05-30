import type { FileBinaryPayload, FileStorageMode } from '../../../core/interfaces/files.js';

export interface FileUrlOptions {
  forceDownload?: boolean;
  downloadName?: string;
}

export interface FileProviderContract {
  readonly storageMode: FileStorageMode;
  uploadFile(payload: FileBinaryPayload): Promise<string>;
  getFileUrl(fileName: string, options?: FileUrlOptions): Promise<string | null>;
  deleteFile(fileName: string): Promise<boolean>;
}
