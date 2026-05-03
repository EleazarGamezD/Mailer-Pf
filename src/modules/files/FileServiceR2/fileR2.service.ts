import { randomUUID } from 'node:crypto';
import { Client } from 'minio';

import { env } from '../../../config/env.js';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import type { FileBinaryPayload } from '../../../core/interfaces/files.js';
import type { FileProviderContract } from '../fileServiceBase/file-provider.contract.js';

export class FileR2Service implements FileProviderContract {
  readonly storageMode = FileStorageModeEnum.R2;

  private readonly client: Client;
  private readonly bucketName: string;

  constructor() {
    if (!env.r2AccountId || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket) {
      throw new Error('R2 storage provider requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.');
    }

    this.client = new Client({
      endPoint: `${env.r2AccountId}.r2.cloudflarestorage.com`,
      port: 443,
      useSSL: true,
      accessKey: env.r2AccessKeyId,
      secretKey: env.r2SecretAccessKey,
      region: 'auto',
    });
    this.bucketName = env.r2Bucket;
  }

  async uploadFile(payload: FileBinaryPayload): Promise<string> {
    const extension = this.normalizeExtension(payload.extension);
    const fileName = `${randomUUID()}.${extension}`;

    await this.client.putObject(this.bucketName, fileName, payload.buffer, payload.size, {
      'Content-Type': payload.mimeType,
    });

    return fileName;
  }

  async getFileUrl(fileName: string) {
    try {
      await this.client.statObject(this.bucketName, fileName);
      return await this.client.presignedGetObject(this.bucketName, fileName, 60 * 60 * 24 * 7, {
        'response-cache-control': 'max-age=3600',
      });
    } catch (error) {
      const minioError = this.toMinioError(error as Error | { code?: string } | null);
      if (this.isMissingObjectError(minioError)) {
        return null;
      }

      throw error;
    }
  }

  async deleteFile(fileName: string) {
    try {
      await this.client.removeObject(this.bucketName, fileName);
      return true;
    } catch (error) {
      const minioError = this.toMinioError(error as Error | { code?: string } | null);
      if (this.isMissingObjectError(minioError)) {
        return false;
      }

      throw error;
    }
  }

  private normalizeExtension(extension: string | null | undefined) {
    return extension?.trim().replace(/^\./u, '').toLowerCase() || '';
  }

  private isMissingObjectError(error: { code?: string } | null | undefined) {
    return error !== undefined && error !== null && (error.code === 'NoSuchKey' || error.code === 'NotFound');
  }

  private toMinioError(error: Error | { code?: string } | null): { code?: string } | null {
    return error && typeof error === 'object' ? ('code' in error ? { code: error.code } : null) : null;
  }
}
