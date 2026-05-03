import { FileStorageModeEnum } from '../enums/file-storage-mode.enum.js';
import type { StoredImageAsset } from './image.js';

export type FileStorageMode = FileStorageModeEnum;

export interface FileBinaryPayload {
  id?: string;
  name?: string;
  base64: string;
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalName: string;
  size: number;
}

export interface FileAssetResponse {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
}

export type ResolvedMetadataPrimitive = string | number | boolean | null;
export type ResolvedMetadataValue =
  | ResolvedMetadataPrimitive
  | StoredImageAsset
  | ResolvedMetadataObject
  | ResolvedMetadataValue[];

export interface ResolvedMetadataObject {
  [key: string]: ResolvedMetadataValue;
}