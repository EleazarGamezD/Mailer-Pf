import { randomUUID } from 'node:crypto';
import { Client } from 'minio';

import { env } from '../../../config/env.js';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import type { FileBinaryPayload } from '../../../core/interfaces/files.js';
import type { FileProviderContract } from '../fileServiceBase/file-provider.contract.js';

export class FileS3Service implements FileProviderContract {
  readonly storageMode = FileStorageModeEnum.S3;

  private readonly client: Client;
  private readonly bucketName: string;

  constructor() {
    if (!env.s3Endpoint || !env.s3Bucket || !env.s3AccessKeyId || !env.s3SecretAccessKey) {
      throw new Error('S3-compatible bucket provider requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    }

    this.client = new Client({
      endPoint: env.s3Endpoint,
      port: env.s3Port || (env.s3UseSSL ? 443 : 80),
      useSSL: env.s3UseSSL,
      accessKey: env.s3AccessKeyId,
      secretKey: env.s3SecretAccessKey,
      region: env.s3Region || undefined,
    });
    this.bucketName = env.s3Bucket;
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

  async clearBucket(): Promise<number> {
    const objectNames = await this.listBucketObjectNames();

    for (const objectName of objectNames) {
      await this.client.removeObject(this.bucketName, objectName);
    }

    return objectNames.length;
  }

  private normalizeExtension(extension: string | null | undefined) {
    return extension?.trim().replace(/^\./u, '').toLowerCase() || '';
  }

  private async listBucketObjectNames(): Promise<string[]> {
    const stream = (this.client as unknown as {
      listObjectsV2(bucketName: string, prefix: string, recursive: boolean): NodeJS.EventEmitter;
    }).listObjectsV2(this.bucketName, '', true);

    return await new Promise<string[]>((resolve, reject) => {
      const objectNames: string[] = [];

      stream.on('data', (entry: { name?: string }) => {
        if (typeof entry?.name === 'string' && entry.name.trim()) {
          objectNames.push(entry.name);
        }
      });
      stream.on('end', () => resolve(objectNames));
      stream.on('error', reject);
    });
  }

  private isMissingObjectError(error: { code?: string } | null | undefined) {
    return error !== undefined && error !== null && (error.code === 'NoSuchKey' || error.code === 'NotFound');
  }

  private toMinioError(error: Error | { code?: string } | null): { code?: string } | null {
    return error && typeof error === 'object' ? ('code' in error ? { code: error.code } : null) : null;
  }
}
