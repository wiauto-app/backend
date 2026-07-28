import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import type {
  OwnerStatisticsReachCountsRaw,
  OwnerStatisticsResponseRateRaw,
  OwnerStatisticsTimeSeriesRow,
} from "../types/owner-statistics";

interface ReachCountsRow {
  listings_published: string;
  impressions: string;
  visits: string;
  leads: string;
  contact_clicks: string;
  favorites: string;
  shares: string;
}

interface ResponseRateRow {
  chats_with_incoming: string;
  chats_with_response: string;
  median_response_minutes: string | null;
}

interface TimeSeriesRow {
  bucket_start: Date;
  impressions: string;
  visits: string;
  messages: string;
  listings_published: string;
}

@Injectable()
export class TypeOrmOwnerStatisticsRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async getReachCounts(params: {
    profile_id: string;
    period_start: Date;
    period_end: Date;
  }): Promise<OwnerStatisticsReachCountsRaw> {
    const rows = await this.data_source.query<ReachCountsRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND v.created_at >= $2
              AND v.created_at < $3
          ) AS listings_published,
          (
            SELECT COUNT(*)::int
            FROM vehicle_impressions vi
            INNER JOIN vehicles v ON v.id = vi.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vi.created_at >= $2
              AND vi.created_at < $3
          ) AS impressions,
          (
            SELECT COUNT(*)::int
            FROM vehicle_views vv
            INNER JOIN vehicles v ON v.id = vv.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vv.created_at >= $2
              AND vv.created_at < $3
          ) AS visits,
          (
            SELECT COUNT(*)::int
            FROM leads l
            INNER JOIN vehicles v ON v.id = l.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND l.created_at >= $2
              AND l.created_at < $3
          ) AS leads,
          (
            SELECT COUNT(*)::int
            FROM vehicle_contact_clicks vcc
            INNER JOIN vehicles v ON v.id = vcc.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vcc.created_at >= $2
              AND vcc.created_at < $3
          ) AS contact_clicks,
          (
            SELECT COUNT(*)::int
            FROM vehicle_list_items vli
            INNER JOIN vehicles v ON v.id = vli.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vli.created_at >= $2
              AND vli.created_at < $3
          ) AS favorites,
          (
            SELECT COUNT(*)::int
            FROM vehicle_shares vs
            INNER JOIN vehicles v ON v.id = vs.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vs.created_at >= $2
              AND vs.created_at < $3
          ) AS shares
      `,
      [params.profile_id, params.period_start, params.period_end],
    );

    const [row] = rows;

    return {
      listings_published: Number(row.listings_published),
      impressions: Number(row.impressions),
      visits: Number(row.visits),
      leads: Number(row.leads),
      contact_clicks: Number(row.contact_clicks),
      favorites: Number(row.favorites),
      shares: Number(row.shares),
    };
  }

  async getResponseRateStats(params: {
    profile_id: string;
    period_start: Date;
    period_end: Date;
  }): Promise<OwnerStatisticsResponseRateRaw> {
    const rows = await this.data_source.query<ResponseRateRow[]>(
      `
        WITH first_incoming AS (
          SELECT DISTINCT ON (cm.chat_id)
            cm.chat_id,
            cm.created_at AS incoming_at
          FROM chat_messages cm
          INNER JOIN chats c ON c.id = cm.chat_id
          INNER JOIN vehicles v ON v.id = c.vehicle_id
          WHERE v.profile_id = $1
            AND v.deleted_at IS NULL
            AND cm.deleted_at IS NULL
            AND cm.sender_id <> $1
            AND cm.created_at >= $2
            AND cm.created_at < $3
          ORDER BY cm.chat_id, cm.created_at ASC
        ),
        first_response AS (
          SELECT
            fi.chat_id,
            MIN(cm.created_at) AS response_at
          FROM first_incoming fi
          INNER JOIN chat_messages cm
            ON cm.chat_id = fi.chat_id
            AND cm.sender_id = $1
            AND cm.deleted_at IS NULL
            AND cm.created_at > fi.incoming_at
            AND cm.created_at <= fi.incoming_at + interval '24 hours'
          GROUP BY fi.chat_id
        )
        SELECT
          COUNT(fi.chat_id)::int AS chats_with_incoming,
          COUNT(fr.chat_id)::int AS chats_with_response,
          PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (fr.response_at - fi.incoming_at)) / 60
          ) AS median_response_minutes
        FROM first_incoming fi
        LEFT JOIN first_response fr ON fr.chat_id = fi.chat_id
      `,
      [params.profile_id, params.period_start, params.period_end],
    );

    const [row] = rows;

    return {
      chats_with_incoming: Number(row.chats_with_incoming),
      chats_with_response: Number(row.chats_with_response),
      median_response_minutes:
        row.median_response_minutes === null
          ? null
          : Math.round(Number(row.median_response_minutes)),
    };
  }

  async getTimeSeries(params: {
    profile_id: string;
    period_start: Date;
    period_end: Date;
    granularity: string;
    step_interval: string;
  }): Promise<OwnerStatisticsTimeSeriesRow[]> {
    const rows = await this.data_source.query<TimeSeriesRow[]>(
      `
        WITH buckets AS (
          SELECT generate_series(
            date_trunc($4, $2::timestamptz),
            date_trunc($4, ($3::timestamptz - interval '1 second')),
            $5::interval
          ) AS bucket_start
        ),
        impressions_agg AS (
          SELECT
            date_trunc($4, vi.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicle_impressions vi
          INNER JOIN vehicles v ON v.id = vi.vehicle_id
          WHERE v.profile_id = $1
            AND v.deleted_at IS NULL
            AND vi.created_at >= $2
            AND vi.created_at < $3
          GROUP BY 1
        ),
        visits_agg AS (
          SELECT
            date_trunc($4, vv.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicle_views vv
          INNER JOIN vehicles v ON v.id = vv.vehicle_id
          WHERE v.profile_id = $1
            AND v.deleted_at IS NULL
            AND vv.created_at >= $2
            AND vv.created_at < $3
          GROUP BY 1
        ),
        messages_agg AS (
          SELECT
            date_trunc($4, cm.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM chat_messages cm
          INNER JOIN chats c ON c.id = cm.chat_id
          INNER JOIN vehicles v ON v.id = c.vehicle_id
          WHERE v.profile_id = $1
            AND v.deleted_at IS NULL
            AND cm.deleted_at IS NULL
            AND cm.sender_id <> $1
            AND cm.created_at >= $2
            AND cm.created_at < $3
          GROUP BY 1
        ),
        listings_agg AS (
          SELECT
            date_trunc($4, v.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicles v
          WHERE v.profile_id = $1
            AND v.deleted_at IS NULL
            AND v.created_at >= $2
            AND v.created_at < $3
          GROUP BY 1
        )
        SELECT
          b.bucket_start,
          COALESCE(i.count, 0) AS impressions,
          COALESCE(vv2.count, 0) AS visits,
          COALESCE(m.count, 0) AS messages,
          COALESCE(l.count, 0) AS listings_published
        FROM buckets b
        LEFT JOIN impressions_agg i ON i.bucket_start = b.bucket_start
        LEFT JOIN visits_agg vv2 ON vv2.bucket_start = b.bucket_start
        LEFT JOIN messages_agg m ON m.bucket_start = b.bucket_start
        LEFT JOIN listings_agg l ON l.bucket_start = b.bucket_start
        ORDER BY b.bucket_start ASC
      `,
      [
        params.profile_id,
        params.period_start,
        params.period_end,
        params.granularity,
        params.step_interval,
      ],
    );

    return rows.map((row) => ({
      bucket_start: row.bucket_start.toISOString(),
      impressions: Number(row.impressions),
      visits: Number(row.visits),
      messages: Number(row.messages),
      listings_published: Number(row.listings_published),
    }));
  }
}
