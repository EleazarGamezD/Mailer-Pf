import { DatabaseCollectionEnum } from '../core/enums/database-collection.enum.js';
import type { ThemeDocument } from '../core/interfaces/theme.js';
import { BaseRepository } from './base.repository.js';

export class ThemesRepository extends BaseRepository<ThemeDocument> {
  constructor() {
    super(DatabaseCollectionEnum.THEMES);
  }

  async deactivateAll(): Promise<void> {
    await this.collection.updateMany({}, { $set: { active: false, updatedAt: new Date() } });
  }
}
