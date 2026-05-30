import type { Filter } from 'mongodb';
import { getDatabase } from '../../config/db.js';
import { AnalyticsEventTypeEnum } from '../../core/enums/analytics-event-type.enum.js';
import { DatabaseCollectionEnum } from '../../core/enums/database-collection.enum.js';
import type { AnalyticsEventDocument } from '../../core/interfaces/domain.js';
import type { AnalyticsEventPayload, AnalyticsFiltersPayload } from '../../core/interfaces/requests.js';
import { isJsonObject } from '../../core/interfaces/json.js';
import { parseEnumValue } from '../../utils/enum.js';
import { AnalyticsEventsRepository } from './analytics.repository.js';

const analyticsEventsRepository = new AnalyticsEventsRepository();

export async function registerAnalyticsEvent(payload: AnalyticsEventPayload) {
  const document: AnalyticsEventDocument = {
    type: parseEnumValue(AnalyticsEventTypeEnum, payload.type, AnalyticsEventTypeEnum.PAGE_VIEW),
    path: typeof payload.path === 'string' ? payload.path : '/',
    projectId: typeof payload.projectId === 'string' ? payload.projectId : null,
    language: typeof payload.language === 'string' ? payload.language : 'es',
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : null,
    meta: isJsonObject(payload.meta) ? payload.meta : {},
    createdAt: new Date(),
  };

  await analyticsEventsRepository.create(document);
  return { tracked: true };
}

function parseDateFilters(filters: AnalyticsFiltersPayload) {
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

export async function getDashboardMetrics(filters: AnalyticsFiltersPayload = {}) {
  const database = getDatabase();
  const matchFilter = parseDateFilters(filters) as Filter<AnalyticsEventDocument>;

  const groupedTotals = await database
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
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
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
    .find(matchFilter, { sort: { createdAt: -1 }, limit: 20 })
    .toArray();

  const totalEvents = await database
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
    .countDocuments(matchFilter);

  const groupedByPath = await database
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
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
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
    .aggregate<{ _id: string | null; projectName: string; total: number }>([
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
      {
        $lookup: {
          from: DatabaseCollectionEnum.PROJECTS,
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$projectId'] },
              },
            },
            { $project: { _id: 0, titleEs: '$title.es' } },
          ],
          as: 'projectDocs',
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          projectName: {
            $ifNull: [{ $arrayElemAt: ['$projectDocs.titleEs', 0] }, '$_id'],
          },
        },
      },
    ])
    .toArray();

  const groupedByLanguage = await database
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const groupedByDay = await database
    .collection<AnalyticsEventDocument>(DatabaseCollectionEnum.ANALYTICS_EVENTS)
    .aggregate<{ _id: string; total: number }>([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
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
    groupedByDay,
    recentEvents,
  };
}
