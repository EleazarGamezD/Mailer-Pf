import type { AdminUserDocument } from '../types/domain.js';

import { BaseRepository } from './base.repository.js';

export class AdminUsersRepository extends BaseRepository<AdminUserDocument> {
  constructor() {
    super('admin_users');
  }
}
