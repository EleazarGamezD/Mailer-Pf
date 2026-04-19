import type { ProjectDocument } from '../../types/domain.js';

import { BaseRepository } from '../../repositories/base.repository.js';

export class ProjectsRepository extends BaseRepository<ProjectDocument> {
  constructor() {
    super('projects');
  }
}
