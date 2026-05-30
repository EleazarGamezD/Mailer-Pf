import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../../config/env.js';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import type { FileBinaryPayload } from '../../../core/interfaces/files.js';
import type { FileProviderContract, FileUrlOptions } from '../fileServiceBase/file-provider.contract.js';

export class FileSupabaseService implements FileProviderContract {
  readonly storageMode = FileStorageModeEnum.S3;

  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor() {
    if (!env.s3EndpointRaw || !env.s3Bucket || !env.s3AccessKeyId || !env.s3SecretAccessKey) {
      throw new Error('Supabase bucket provider requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    }

    this.client = new S3Client({
      region: env.s3Region || 'us-east-1',
      endpoint: env.s3EndpointRaw,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey,
      },
    });
    this.bucketName = env.s3Bucket;
  }

  async uploadFile(payload: FileBinaryPayload): Promise<string> {
    const extension = this.normalizeExtension(payload.extension);
    const fileName = `${randomUUID()}.${extension}`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: payload.buffer,
      ContentType: payload.mimeType,
    }));

    return fileName;
  }

  async getFileUrl(fileName: string, options?: FileUrlOptions): Promise<string | null> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      }));

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        ...(options?.forceDownload
          ? { ResponseContentDisposition: `attachment; filename="${options.downloadName ?? fileName}"` }
          : {}),
      });

      return await getSignedUrl(this.client, command, { expiresIn: 60 * 60 * 24 * 7 });
    } catch (error) {
      if (this.isMissingObjectError(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      }));
      return true;
    } catch (error) {
      if (this.isMissingObjectError(error)) {
        return false;
      }

      throw error;
    }
  }

  private normalizeExtension(extension: string | null | undefined) {
    return extension?.trim().replace(/^\./u, '').toLowerCase() || '';
  }

  private isMissingObjectError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };

    return (
      candidate.name === 'NotFound' ||
      candidate.Code === 'NotFound' ||
      candidate.Code === 'NoSuchKey' ||
      candidate.$metadata?.httpStatusCode === 404
    );
  }
}
