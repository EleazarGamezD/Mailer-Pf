import type { ProjectDocument } from '../../core/interfaces/domain.js';

import { BaseRepository } from '../../repositories/base.repository.js';

export class ProjectsRepository extends BaseRepository<ProjectDocument> {
  constructor() {
    super('projects');
  }
}
