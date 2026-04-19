import type { ContentDocument, ProfileDocument } from '../../types/domain.js';

import { BaseRepository } from '../../repositories/base.repository.js';

export class ContentRepository extends BaseRepository<ContentDocument> {
  constructor(collectionName: string) {
    super(collectionName);
  }
}

export class ProfileRepository extends BaseRepository<ProfileDocument> {
  constructor() {
    super('profile');
  }
}
