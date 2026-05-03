import { randomUUID } from 'node:crypto';
import { Binary } from 'mongodb';
import { FileStorageModeEnum } from '../../../core/enums/file-storage-mode.enum.js';
import type { StoredFileEntity } from '../../../core/interfaces/domain.js';
import type { FileAssetResponse, FileBinaryPayload } from '../../../core/interfaces/files.js';
import { FileBaseService } from '../fileServiceBase/fileBase.service.js';
import { FilesRepository } from '../files.repository.js';

const filesRepository = new FilesRepository();

export class FileDatabaseService extends FileBaseService {
    constructor() {
        super(FileStorageModeEnum.DB);
    }

    async uploadFile(payload: FileBinaryPayload): Promise<string> {
        const fileName = `${randomUUID()}.${this.normalizeExtension(payload.extension)}`;

        await filesRepository.create({
            fileName,
            buffer: new Binary(payload.buffer),
        } satisfies StoredFileEntity);

        return fileName;
    }

    async getFileUrl(fileName: string) {
        const file = await filesRepository.findByFileName(fileName);
        return file ? this.buildDbAssetUrl(file.fileName) : null;
    }

    async deleteFile(fileName: string) {
        const result = await filesRepository.deleteByFileName(fileName);
        return result.deletedCount > 0;
    }

    async getAsset(fileName: string): Promise<FileAssetResponse | null> {
        const file = await filesRepository.findByFileName(fileName);
        if (!file) {
            return null;
        }

        return {
            buffer: Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer.buffer),
            mimeType: this.mimeTypeFromExtension(this.extractExtension(file.fileName)),
            fileName: file.fileName,
            size: Buffer.isBuffer(file.buffer) ? file.buffer.length : file.buffer.length(),
        };
    }
}
