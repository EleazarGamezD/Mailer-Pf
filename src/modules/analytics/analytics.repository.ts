import type { AnalyticsEventDocument } from '../../core/interfaces/domain.js';

import { BaseRepository } from '../../repositories/base.repository.js';

export class AnalyticsEventsRepository extends BaseRepository<AnalyticsEventDocument> {
  constructor() {
    super('analytics_events');
  }
}
