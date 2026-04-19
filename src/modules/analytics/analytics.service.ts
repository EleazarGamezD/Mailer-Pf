import { getDatabase } from '../../config/db.js';
import type { AnalyticsEventDocument } from '../../types/domain.js';
import type { Filter } from 'mongodb';
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

function parseDateFilters(filters: Record<string, unknown>) {
  const now = new Date();
  const fromValue = typeof filters.from === 'string' ? filters.from : '';
  const toValue = typeof filters.to === 'string' ? filters.to : '';
  const year = typeof filters.year === 'string' ? Number(filters.year) : Number(filters.year);
  const month = typeof filters.month === 'string' ? Number(filters.month) : Number(filters.month);
  const day = typeof filters.day === 'string' ? Number(filters.day) : Number(filters.day);

  if (fromValue || toValue) {
    const createdAt: Record<string, Date> = {};

    if (fromValue) {
      createdAt.$gte = new Date(fromValue);
    }

    if (toValue) {
      createdAt.$lte = new Date(toValue);
    }

    return Object.keys(createdAt).length > 0 ? { createdAt } : {};
  }

  if (Number.isFinite(year) && year > 0) {
    const start = new Date(Date.UTC(year, Number.isFinite(month) && month > 0 ? month - 1 : 0, Number.isFinite(day) && day > 0 ? day : 1));
    const end = new Date(start);

    if (Number.isFinite(day) && day > 0) {
      end.setUTCDate(end.getUTCDate() + 1);
    } else if (Number.isFinite(month) && month > 0) {
      end.setUTCMonth(end.getUTCMonth() + 1);
    } else {
      end.setUTCFullYear(end.getUTCFullYear() + 1);
    }

    return {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };
  }

  return {
    createdAt: {
      $gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    },
  };
}

export async function getDashboardMetrics(filters: Record<string, unknown> = {}) {
  const database = getDatabase();
  const matchFilter = parseDateFilters(filters) as Filter<AnalyticsEventDocument>;

  const groupedTotals = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .aggregate<{ _id: string; total: number }>([
      {
        $match: matchFilter,
      },
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
    .find(matchFilter, { sort: { createdAt: -1 }, limit: 20 })
    .toArray();

  const totalEvents = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .countDocuments(matchFilter);

  const groupedByPath = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .aggregate<{ _id: string; total: number }>([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: '$path',
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ])
    .toArray();

  const groupedByProject = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .aggregate<{ _id: string | null; total: number }>([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ])
    .toArray();

  const groupedByLanguage = await database
    .collection<AnalyticsEventDocument>('analytics_events')
    .aggregate<{ _id: string; total: number }>([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: '$language',
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ])
    .toArray();

  return {
    filters: matchFilter,
    totalEvents,
    groupedTotals,
    groupedByPath,
    groupedByProject,
    groupedByLanguage,
    recentEvents,
  };
}
