import { randomUUID } from 'node:crypto';

import { Client } from 'minio';

import { env } from '../../../config/env.js';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import { createHttpError } from '../../../utils/http-error.js';
import { FileBaseService, type FileAssetResponse, type FileBinaryPayload } from '../fileServiceBase/fileBase.service.js';

export class FileBucketService extends FileBaseService {
    private readonly client: Client;
    private readonly bucketName: string;

    constructor() {
        super(FileStorageModeEnum.BUCKET);

        if (!env.minioEndpoint || !env.minioPort || !env.minioBucket || !env.minioUser || !env.minioPassword) {
            throw new Error('Bucket storage mode requires MinIO configuration envs.');
        }

        this.client = new Client({
            endPoint: env.minioEndpoint,
            port: env.minioPort,
            useSSL: env.minioUseSSL,
            accessKey: env.minioUser,
            secretKey: env.minioPassword,
            region: env.minioRegion || undefined,
        });
        this.bucketName = env.minioBucket;
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

    async getAsset(_fileName: string): Promise<FileAssetResponse | null> {
        return null;
    }

    private async requireFileUrl(fileName: string) {
        const url = await this.getFileUrl(fileName);
        if (!url) {
            throw createHttpError(500, `Unable to resolve bucket URL for ${fileName}.`);
        }

        return url;
    }

    private isMissingObjectError(error: { code?: string } | null | undefined) {
        return (
            error !== undefined &&
            error !== null &&
            (error.code === 'NoSuchKey' || error.code === 'NotFound')
        );
    }

    private toMinioError(error: Error | { code?: string } | null): { code?: string } | null {
        return error && typeof error === 'object' ? ('code' in error ? { code: error.code } : null) : null;
    }
}
