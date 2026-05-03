import { env } from '../../../config/env.js';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import type {
    FileAssetResponse,
    FileBinaryPayload,
    FileStorageMode,
    ResolvedMetadataObject,
    ResolvedMetadataValue,
} from '../../../core/interfaces/files.js';
import type { ImageUploadContract, StoredImageAsset } from '../../../core/interfaces/image.js';
import type { JsonObject, JsonValue } from '../../../core/interfaces/json.js';
import { isJsonObject } from '../../../core/interfaces/json.js';
import { createHttpError } from '../../../utils/http-error.js';

export type { FileAssetResponse, FileBinaryPayload, FileStorageMode } from '../../../core/interfaces/files.js';

export abstract class FileBaseService {
    readonly storageMode: FileStorageMode;

    protected constructor(storageMode: FileStorageMode) {
        this.storageMode = storageMode;
    }

    abstract uploadFile(payload: FileBinaryPayload): Promise<string>;
    abstract getFileUrl(fileName: string): Promise<string | null>;
    abstract deleteFile(fileName: string): Promise<boolean>;
    abstract getAsset(fileName: string): Promise<FileAssetResponse | null>;

    async uploadMany(files: FileBinaryPayload[]) {
        return Promise.all(files.map((file) => this.uploadFile(file)));
    }

    async normalizeImageAsset(
        payload: string | ImageUploadContract | StoredImageAsset | JsonObject | null | undefined,
        fieldName: string,
    ): Promise<string | null> {
        return this.storeAssetLikeValue(payload, fieldName);
    }

    async normalizeImageCollection(
        payload: Array<string | ImageUploadContract | StoredImageAsset | JsonObject | null> | null | undefined,
        fieldName: string,
    ): Promise<string[]> {
        if (payload == null) {
            return [];
        }

        if (!Array.isArray(payload)) {
            throw createHttpError(400, `${fieldName} must be an array.`);
        }

        const normalized = await Promise.all(payload.map((item, index) => this.storeAssetLikeValue(item, `${fieldName}[${index}]`)));
        return normalized.filter((item): item is string => item !== null);
    }

    async storeProfileMetadata<T extends JsonObject>(payload: T): Promise<T> {
        return (await this.storeMetadataValue(payload, 'metadata')) as T;
    }

    async resolveProfileMetadata<T extends JsonObject>(payload: T): Promise<ResolvedMetadataObject> {
        return await this.resolveMetadataValue(payload, 'metadata') as ResolvedMetadataObject;
    }

    async resolveImageAsset(asset: string | StoredImageAsset | null | undefined): Promise<string | StoredImageAsset | null> {
        if (!asset) {
            return null;
        }

        if (typeof asset === 'string') {
            if (this.isDirectUrl(asset)) {
                return asset;
            }

            const url = await this.getFileUrl(asset);
            if (!url) {
                return null;
            }

            return {
                storage: this.storageMode,
                fileName: asset,
                extension: this.extractExtension(asset) ?? undefined,
                url,
            };
        }

        if (asset.url && !asset.fileName) {
            return asset.url;
        }

        if (!asset.fileName) {
            return null;
        }

        const resolved = await this.resolveImageAsset(asset.fileName);
        if (!resolved || typeof resolved === 'string') {
            return resolved;
        }

        return {
            id: asset.id,
            name: asset.name,
            ...resolved,
        };
    }

    protected buildDbAssetUrl(fileName: string) {
        const normalizedFileName = encodeURIComponent(fileName);
        const normalizedBaseUrl = env.apiBaseUrl.replace(/\/+$/u, '');

        if (
            env.nodeEnv !== 'production' &&
            /^(?:https?:\/\/)?localhost(?::\d+)?(?:\/api)?$/u.test(normalizedBaseUrl)
        ) {
            return `/api/assets/${normalizedFileName}`;
        }

        const resolvedBaseUrl = normalizedBaseUrl.startsWith('http://') || normalizedBaseUrl.startsWith('https://')
            ? normalizedBaseUrl
            : `https://${normalizedBaseUrl}`;
        const baseUrl = new URL(resolvedBaseUrl);
        const normalizedPathname = baseUrl.pathname.replace(/\/+$/u, '');
        const apiPath = normalizedPathname.endsWith('/api')
            ? normalizedPathname
            : `${normalizedPathname || ''}/api`;

        return `${baseUrl.origin}${apiPath}/assets/${normalizedFileName}`;
    }

    protected normalizeExtension(extension: string | null | undefined) {
        return extension?.trim().replace(/^\./u, '').toLowerCase() || '';
    }

    protected extractExtension(fileName: string) {
        const normalized = fileName.trim();
        if (!normalized.includes('.')) {
            return null;
        }

        return normalized.split('.').pop()?.toLowerCase() ?? null;
    }

    protected extensionFromMimeType(mimeType: string) {
        const mimeMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'image/avif': 'avif',
        };

        return mimeMap[mimeType.toLowerCase()] ?? null;
    }

    protected mimeTypeFromExtension(extension: string | null | undefined) {
        const normalized = this.normalizeExtension(extension);
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            avif: 'image/avif',
        };

        return mimeMap[normalized] ?? 'application/octet-stream';
    }

    protected readOptionalString(value: JsonValue | undefined) {
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    private isDirectUrl(value: string) {
        return /^(?:https?:)?\/\//u.test(value) || value.startsWith('/') || value.startsWith('data:');
    }

    private async storeAssetLikeValue(
        payload: string | StoredImageAsset | JsonObject | null | undefined,
        fieldName: string,
    ): Promise<string | null> {
        if (payload == null || payload === '') {
            return null;
        }

        if (typeof payload === 'string') {
            return payload;
        }

        if (!isJsonObject(payload)) {
            throw createHttpError(400, `${fieldName} must be a string, object or null.`);
        }

        const binaryPayload = this.extractBinaryPayload(payload);
        if (binaryPayload) {
            return this.uploadFile(binaryPayload);
        }

        if (typeof payload.fileName === 'string' && payload.fileName.trim()) {
            return payload.fileName.trim();
        }

        if (typeof payload.url === 'string' && payload.url.trim()) {
            return payload.url.trim();
        }

        return null;
    }

    private async storeMetadataValue(value: JsonValue | undefined, fieldName: string): Promise<JsonValue> {
        if (value === undefined) {
            return null;
        }

        if (Array.isArray(value)) {
            return Promise.all(value.map((item, index) => this.storeMetadataValue(item, `${fieldName}[${index}]`)));
        }

        if (!isJsonObject(value)) {
            return value;
        }

        const asset = await this.normalizeAssetObjectByKey(value, fieldName, 'store');
        if (asset.shouldReturnAsset) {
            return asset.value;
        }

        const result: JsonObject = {};
        for (const [key, item] of Object.entries(value)) {
            if (this.isImageCollectionMetadataKey(key)) {
                result[key] = await this.normalizeImageCollection(
                    item as Array<string | ImageUploadContract | StoredImageAsset | JsonObject | null>,
                    `${fieldName}.${key}`,
                );
                continue;
            }

            if (this.isImageMetadataKey(key)) {
                result[key] = await this.normalizeImageAsset(
                    item as string | ImageUploadContract | StoredImageAsset | JsonObject | null | undefined,
                    `${fieldName}.${key}`,
                );
                continue;
            }

            if (key === 'image' || key === 'coverImage' || key === 'images') {
                result[key] = key === 'images'
                    ? await this.normalizeImageCollection(
                        item as Array<string | ImageUploadContract | StoredImageAsset | JsonObject | null>,
                        `${fieldName}.${key}`,
                    )
                    : await this.normalizeImageAsset(
                        item as string | ImageUploadContract | StoredImageAsset | JsonObject | null | undefined,
                        `${fieldName}.${key}`,
                    );
                continue;
            }

            result[key] = await this.storeMetadataValue(item, `${fieldName}.${key}`);
        }

        return result;
    }

    private async resolveMetadataValue(value: JsonValue | undefined, fieldName: string): Promise<ResolvedMetadataValue> {
        if (value === undefined) {
            return null;
        }

        if (Array.isArray(value)) {
            return Promise.all(value.map((item, index) => this.resolveMetadataValue(item, `${fieldName}[${index}]`)));
        }

        if (!isJsonObject(value)) {
            return value;
        }

        const asset = await this.normalizeAssetObjectByKey(value, fieldName, 'resolve');
        if (asset.shouldReturnAsset) {
            return asset.value;
        }

        const result: ResolvedMetadataObject = {};
        for (const [key, item] of Object.entries(value)) {
            if (this.isImageCollectionMetadataKey(key)) {
                if (Array.isArray(item)) {
                    result[key] = (await Promise.all(item.map((entry) => this.resolveImageAsset(entry as string | StoredImageAsset | null))))
                        .filter((entry): entry is string | StoredImageAsset => entry !== null);
                }
                continue;
            }

            if (this.isImageMetadataKey(key)) {
                result[key] = await this.resolveImageAsset(item as string | StoredImageAsset | null);
                continue;
            }

            if (key === 'image' || key === 'coverImage' || key === 'images') {
                if (key === 'images' && Array.isArray(item)) {
                    result[key] = (await Promise.all(item.map((entry) => this.resolveImageAsset(entry as string | StoredImageAsset | null))))
                        .filter((entry): entry is string | StoredImageAsset => entry !== null);
                } else {
                    result[key] = await this.resolveImageAsset(item as string | StoredImageAsset | null);
                }
                continue;
            }

            result[key] = await this.resolveMetadataValue(item, `${fieldName}.${key}`);
        }

        return result;
    }

    private async normalizeAssetObjectByKey(
        candidate: JsonObject,
        fieldName: string,
        mode: 'store' | 'resolve',
    ) {
        const hasAssetKeys =
            'file' in candidate ||
            'buffer' in candidate ||
            'base64' in candidate ||
            'fileName' in candidate ||
            'url' in candidate;

        if (!hasAssetKeys) {
            return { shouldReturnAsset: false, value: null };
        }

        const isAssetOnlyObject = Object.keys(candidate).every((key) =>
            ['id', 'file', 'buffer', 'base64', 'fileName', 'url', 'mimeType', 'extension', 'name', 'originalName', 'storage'].includes(key),
        );

        if (!isAssetOnlyObject) {
            return { shouldReturnAsset: false, value: null };
        }

        return {
            shouldReturnAsset: true,
            value:
                mode === 'store'
                    ? await this.storeAssetLikeValue(candidate, fieldName)
                    : await this.resolveImageAsset(this.toStoredImageAsset(candidate)),
        };
    }

    private extractBinaryPayload(candidate: JsonObject): FileBinaryPayload | null {
        const rawBase64 = this.readRawBinary(candidate);
        if (!rawBase64) {
            return null;
        }

        const parsed = this.parseBase64(rawBase64);
        const extension = this.normalizeExtension(
            this.readOptionalString(candidate.extension) ??
            this.extractExtension(this.readOptionalString(candidate.fileName) ?? '') ??
            this.extractExtension(this.readOptionalString(candidate.name) ?? '') ??
            this.extensionFromMimeType(parsed.mimeType ?? ''),
        );

        if (!extension) {
            throw createHttpError(400, 'Image extension is required when uploading files.');
        }

        const mimeType = parsed.mimeType ?? this.mimeTypeFromExtension(extension);

        const originalName =
            this.readOptionalString(candidate.name) ??
            this.readOptionalString(candidate.originalName) ??
            this.readOptionalString(candidate.fileName) ??
            `upload.${extension}`;

        return {
            id: this.readOptionalString(candidate.id) ?? undefined,
            name: this.readOptionalString(candidate.name) ?? originalName,
            base64: parsed.base64,
            buffer: Buffer.from(parsed.base64, 'base64'),
            mimeType,
            extension,
            originalName,
            size: Buffer.byteLength(parsed.base64, 'base64'),
        };
    }

    private readRawBinary(candidate: JsonObject) {
        const value = candidate.base64 ?? candidate.file ?? candidate.buffer;
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }

        if (this.isByteArray(value)) {
            return Buffer.from(value).toString('base64');
        }

        return null;
    }

    private parseBase64(raw: string) {
        const match = /^data:(?<mime>[^;]+);base64,(?<base64>.+)$/u.exec(raw);
        if (match?.groups?.base64) {
            return {
                mimeType: match.groups.mime,
                base64: match.groups.base64,
            };
        }

        return {
            mimeType: null,
            base64: raw,
        };
    }

    private isByteArray(value: JsonValue | undefined): value is number[] {
        return Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 255);
    }

    private isImageMetadataKey(key: string) {
        return /(image|icon|logo|background)$/iu.test(key);
    }

    private isImageCollectionMetadataKey(key: string) {
        return /(images|icons|logos|backgrounds)$/iu.test(key);
    }

    private toStoredImageAsset(candidate: JsonObject): StoredImageAsset {
        const fileName = typeof candidate.fileName === 'string' ? candidate.fileName.trim() : '';

        return {
            id: typeof candidate.id === 'string' ? candidate.id : undefined,
            name: typeof candidate.name === 'string' ? candidate.name : undefined,
            storage:
                candidate.storage === FileStorageModeEnum.DB || candidate.storage === FileStorageModeEnum.BUCKET
                    ? candidate.storage
                    : undefined,
            fileName,
            extension: typeof candidate.extension === 'string' ? candidate.extension : undefined,
            url: typeof candidate.url === 'string' ? candidate.url : undefined,
        };
    }
}
