import type { StoredImageAsset } from '../../types/domain.js';

import { createHttpError } from '../../utils/http-error.js';

type ImageReference = string | StoredImageAsset;

class FileService {
  normalizeImageAsset(value: unknown, fieldName = 'image'): ImageReference | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'string') {
      return this.normalizeStringValue(value, fieldName);
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw createHttpError(400, `${fieldName} must be a string or image asset object.`);
    }

    const asset = value as Record<string, unknown>;
    const rawFile = this.extractRawFile(asset);
    const url = this.readString(asset.url);

    if (rawFile) {
      const mimeType = this.resolveMimeType(asset, rawFile, fieldName);
      const extension = this.resolveExtension(asset, mimeType);
      const fileName = this.readString(asset.fileName) || `image.${extension}`;

      return {
        file: rawFile,
        mimeType,
        fileName,
        extension,
      };
    }

    if (url) {
      return { url };
    }

    return null;
  }

  normalizeImageCollection(value: unknown, fieldName = 'images'): ImageReference[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item, index) => this.normalizeImageAsset(item, `${fieldName}[${index}]`))
      .filter((item): item is ImageReference => Boolean(item));
  }

  normalizeProfileMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const heroSlides = Array.isArray(metadata.heroSlides)
      ? metadata.heroSlides.map((slide, index) => this.normalizeHeroSlide(slide, index))
      : [];

    return {
      ...metadata,
      heroSlides,
    };
  }

  private normalizeHeroSlide(slide: unknown, index: number): Record<string, unknown> {
    if (!slide || typeof slide !== 'object' || Array.isArray(slide)) {
      throw createHttpError(400, `metadata.heroSlides[${index}] must be an object.`);
    }

    const heroSlide = slide as Record<string, unknown>;

    return {
      ...heroSlide,
      image: this.normalizeImageAsset(heroSlide.image, `metadata.heroSlides[${index}].image`),
    };
  }

  private normalizeStringValue(value: string, fieldName: string): ImageReference | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('data:image/')) {
      const [header, rawFile] = trimmed.split(',', 2);
      if (!rawFile) {
        throw createHttpError(400, `${fieldName} contains an invalid data URL.`);
      }

      const mimeType = this.extractMimeTypeFromDataUrl(header) || 'image/webp';
      const extension = this.resolveExtension({}, mimeType);

      return {
        file: rawFile,
        mimeType,
        fileName: `image.${extension}`,
        extension,
      };
    }

    return trimmed;
  }

  private extractRawFile(asset: Record<string, unknown>): string {
    const file = this.readString(asset.file);
    if (file) {
      return this.stripDataUrlPrefix(file);
    }

    const base64 = this.readString(asset.base64);
    if (base64) {
      return this.stripDataUrlPrefix(base64);
    }

    return '';
  }

  private resolveMimeType(asset: Record<string, unknown>, rawFile: string, fieldName: string): string {
    const providedMimeType = this.readString(asset.mimeType);
    if (providedMimeType) {
      this.assertImageMimeType(providedMimeType, fieldName);
      return providedMimeType;
    }

    const dataUrlMimeType = this.extractMimeTypeFromDataUrl(this.readString(asset.file) || this.readString(asset.base64));
    if (dataUrlMimeType) {
      this.assertImageMimeType(dataUrlMimeType, fieldName);
      return dataUrlMimeType;
    }

    if (!rawFile) {
      throw createHttpError(400, `${fieldName} is missing binary image data.`);
    }

    return 'image/webp';
  }

  private resolveExtension(asset: Record<string, unknown>, mimeType: string): string {
    const providedExtension = this.readString(asset.extension);
    if (providedExtension) {
      return providedExtension.replace(/^\./, '').toLowerCase();
    }

    const fileName = this.readString(asset.fileName);
    if (fileName.includes('.')) {
      return fileName.split('.').pop()!.toLowerCase();
    }

    return mimeType.split('/')[1] || 'webp';
  }

  private stripDataUrlPrefix(value: string): string {
    return value.startsWith('data:') ? value.split(',')[1] || '' : value;
  }

  private extractMimeTypeFromDataUrl(value: string): string {
    if (!value.startsWith('data:')) {
      return '';
    }

    const match = value.match(/^data:([^;]+);base64,/i);
    return match?.[1] || '';
  }

  private assertImageMimeType(mimeType: string, fieldName: string): void {
    if (!mimeType.startsWith('image/')) {
      throw createHttpError(400, `${fieldName} must use an image mimeType.`);
    }
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}

export const fileService = new FileService();