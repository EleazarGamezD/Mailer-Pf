import type { AnalyticsEventDocument } from '../../types/domain.js';

import { BaseRepository } from '../../repositories/base.repository.js';

export class AnalyticsEventsRepository extends BaseRepository<AnalyticsEventDocument> {
  constructor() {
    super('analytics_events');
  }
}
