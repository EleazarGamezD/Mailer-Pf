import { BucketProviderEnum } from '../../../core/enums/bucket-provider.enum.js';
import type {
  FileBinaryPayload,
  FileStorageMode,
  ResolvedMetadataObject,
} from '../../../core/interfaces/files.js';
import type { ImageUploadContract, StoredImageAsset } from '../../../core/interfaces/image.js';
import type { JsonObject } from '../../../core/interfaces/json.js';
import { env } from '../../../config/env.js';
import { FileR2Service } from '../FileServiceR2/fileR2.service.js';
import { FileS3Service } from '../FileServiceS3/fileS3.service.js';
import { FileSupabaseService } from '../FileServiceSupabase/fileSupabase.service.js';
import type { FileProviderContract } from './file-provider.contract.js';
import { FileAssetsService } from './file-assets.service.js';

export type { FileBinaryPayload, FileStorageMode } from '../../../core/interfaces/files.js';

export class FileBaseService {
  private readonly provider: FileProviderContract;
  private readonly assets: FileAssetsService;

  readonly storageMode: FileStorageMode;

  constructor() {
    switch (env.bucketProvider) {
      case BucketProviderEnum.CLOUDFLARE:
        this.provider = new FileR2Service();
        break;
      case BucketProviderEnum.SUPABASE:
        this.provider = new FileSupabaseService();
        break;
      case BucketProviderEnum.MINIO:
      case BucketProviderEnum.AMAZON:
      default:
        this.provider = new FileS3Service();
        break;
    }
    this.storageMode = this.provider.storageMode;
    this.assets = new FileAssetsService(this);
  }

  async uploadFile(payload: FileBinaryPayload): Promise<string> {
    return this.provider.uploadFile(payload);
  }

  async uploadMany(files: FileBinaryPayload[]) {
    return Promise.all(files.map((file) => this.provider.uploadFile(file)));
  }

  async getFileUrl(fileName: string): Promise<string | null> {
    return this.provider.getFileUrl(fileName);
  }

  async getDownloadUrl(fileName: string, downloadName?: string): Promise<string | null> {
    return this.provider.getFileUrl(fileName, { forceDownload: true, downloadName });
  }

  async deleteFile(fileName: string): Promise<boolean> {
    return this.provider.deleteFile(fileName);
  }

  async clearBucket(): Promise<number> {
    return this.provider.clearBucket();
  }

  async normalizeImageAsset(
    payload: string | ImageUploadContract | StoredImageAsset | JsonObject | null | undefined,
    fieldName: string,
  ): Promise<string | null> {
    return this.assets.normalizeImageAsset(payload, fieldName);
  }

  async normalizeImageCollection(
    payload: Array<string | ImageUploadContract | StoredImageAsset | JsonObject | null> | null | undefined,
    fieldName: string,
  ): Promise<string[]> {
    return this.assets.normalizeImageCollection(payload, fieldName);
  }

  async storeProfileMetadata<T extends JsonObject>(payload: T): Promise<T> {
    return this.assets.storeProfileMetadata(payload);
  }

  async resolveProfileMetadata<T extends JsonObject>(payload: T): Promise<ResolvedMetadataObject> {
    return this.assets.resolveProfileMetadata(payload);
  }

  async resolveImageAsset(asset: string | StoredImageAsset | null | undefined): Promise<string | StoredImageAsset | null> {
    return this.assets.resolveImageAsset(asset);
  }
}
