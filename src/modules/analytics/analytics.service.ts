import { getDatabase } from '../../config/db.js';
import type { AnalyticsEventDocument } from '../../types/domain.js';
import { AnalyticsEventsRepository } from './analytics.repository.js';

const analyticsEventsRepository = new AnalyticsEventsRepository();

export async function registerAnalyticsEvent(payload: Record<string, unknown>) {
  const document: AnalyticsEventDocument = {
    type: typeof payload.type === 'string' ? payload.type : 'page_view',
    path: typeof payload.path === 'string' ? payload.path : '/',
    projectId: typeof payload.projectId === 'string' ? payload.projectId : null,
    language: typeof payload.language === 'string' ? payload.language : 'es',
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : null,
    meta:
      payload.meta && typeof payload.meta === 'object'
        ? (payload.meta as Record<string, unknown>)
        : {},
    createdAt: new Date(),
  };

  await analyticsEventsRepository.create(document);
  return { tracked: true };
}

export async function getDashboardMetrics() {
  const database = getDatabase();
  const groupedTotals = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .aggregate<{ _id: string; total: number }>([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ])
    .toArray();

  const recentEvents = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .find({}, { sort: { createdAt: -1 }, limit: 20 })
    .toArray();

  const totalEvents = await database.collection('analytics_events').countDocuments();

  return {
    totalEvents,
    groupedTotals,
    recentEvents,
  };
}
