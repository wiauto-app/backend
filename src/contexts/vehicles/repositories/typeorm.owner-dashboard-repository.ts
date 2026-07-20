import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { STATUS_VEHICLE } from "../types/vehicle";
import { VEHICLE_PRICE_STATUS } from "../vehicle-prices/types/vehicle-price";
import {
  OwnerDashboardInventoryVehicleRow,
  OwnerDashboardPriceDeviationRow,
  OwnerDashboardSummaryRaw,
  OwnerDashboardViewsBucket,
} from "../types/owner-dashboard";
import type { OwnerDashboardGranularity } from "../types/owner-dashboard";
type SummaryRow = {
  active_stock_current: string;
  active_stock_previous: string;
  views_current: string;
  views_previous: string;
  leads_current: string;
  leads_previous: string;
  sales_value_current: string;
  sales_value_previous: string;
};

type ViewsBucketRow = {
  bucket_start: Date;
  count: string;
};

type CountRow = {
  count: string;
};

type InventoryRow = {
  vehicle_id: string;
  title: string;
  price: string;
  model_id: string;
  image_count: string;
  description_length: string;
  mileage: string;
  is_featured: boolean;
  featured_expires_at: Date | null;
  listing_age_days: string;
};

type PriceDeviationRow = {
  vehicle_id: string;
  title: string;
  price: string;
  benchmark_price: string;
  deviation_percent: string;
};

const resolveDateTruncUnit = (
  granularity: OwnerDashboardGranularity,
): "day" | "week" | "month" => {
  switch (granularity) {
    case "day": {
      return "day";
    }
    case "week": {
      return "week";
    }
    case "month": {
      return "month";
    }
  }
};

const map_summary_row = (row: SummaryRow): OwnerDashboardSummaryRaw => ({
  active_stock_current: Number(row.active_stock_current ?? 0),
  active_stock_previous: Number(row.active_stock_previous ?? 0),
  views_current: Number(row.views_current ?? 0),
  views_previous: Number(row.views_previous ?? 0),
  leads_current: Number(row.leads_current ?? 0),
  leads_previous: Number(row.leads_previous ?? 0),
  sales_value_current: Number(row.sales_value_current ?? 0),
  sales_value_previous: Number(row.sales_value_previous ?? 0),
});

@Injectable()
export class TypeOrmOwnerDashboardRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {
  }

  async getSummary(params: {
    profile_id: string;
    current_start: Date;
    previous_start: Date;
    period_end: Date;
  }): Promise<OwnerDashboardSummaryRaw> {
    const rows = await this.data_source.query<SummaryRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.profile_id = $1
              AND v.status = $5
              AND v.deleted_at IS NULL
          ) AS active_stock_current,
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.profile_id = $1
              AND v.status = $5
              AND v.deleted_at IS NULL
              AND GREATEST(COALESCE(v.renewed_at, v.created_at), v.created_at) < $2
          ) AS active_stock_previous,
          (
            SELECT COUNT(*)::int
            FROM vehicle_views vv
            INNER JOIN vehicles v ON v.id = vv.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vv.created_at >= $2
              AND vv.created_at < $4
          ) AS views_current,
          (
            SELECT COUNT(*)::int
            FROM vehicle_views vv
            INNER JOIN vehicles v ON v.id = vv.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND vv.created_at >= $3
              AND vv.created_at < $2
          ) AS views_previous,
          (
            SELECT COUNT(*)::int
            FROM leads l
            INNER JOIN vehicles v ON v.id = l.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND l.created_at >= $2
              AND l.created_at < $4
          ) AS leads_current,
          (
            SELECT COUNT(*)::int
            FROM leads l
            INNER JOIN vehicles v ON v.id = l.vehicle_id
            WHERE v.profile_id = $1
              AND v.deleted_at IS NULL
              AND l.created_at >= $3
              AND l.created_at < $2
          ) AS leads_previous,
          (
            SELECT COALESCE(SUM(vp.price), 0)::int
            FROM vehicles v
            INNER JOIN vehicle_prices vp
              ON vp.vehicle_id = v.id
              AND vp.status = $6
            WHERE v.profile_id = $1
              AND v.status = $7
              AND v.deleted_at IS NULL
              AND v.updated_at >= $2
              AND v.updated_at < $4
          ) AS sales_value_current,
          (
            SELECT COALESCE(SUM(vp.price), 0)::int
            FROM vehicles v
            INNER JOIN vehicle_prices vp
              ON vp.vehicle_id = v.id
              AND vp.status = $6
            WHERE v.profile_id = $1
              AND v.status = $7
              AND v.deleted_at IS NULL
              AND v.updated_at >= $3
              AND v.updated_at < $2
          ) AS sales_value_previous
      `,
      [
        params.profile_id,
        params.current_start,
        params.previous_start,
        params.period_end,
        STATUS_VEHICLE.ACTIVE,
        VEHICLE_PRICE_STATUS.ACTIVE,
        STATUS_VEHICLE.SOLD],
    );

    return map_summary_row(rows[0] ?? {
      active_stock_current: "0",
      active_stock_previous: "0",
      views_current: "0",
      views_previous: "0",
      leads_current: "0",
      leads_previous: "0",
      sales_value_current: "0",
      sales_value_previous: "0",
    });
  }

  async getViewsTimeSeries(params: {
    profile_id: string;
    period_start: Date;
    period_end: Date;
    granularity: OwnerDashboardGranularity;
  }): Promise<OwnerDashboardViewsBucket[]> {
    const date_trunc_unit = resolveDateTruncUnit(params.granularity);
    const rows = await this.data_source.query<ViewsBucketRow[]>(
      `
        SELECT
          date_trunc('${date_trunc_unit}', vv.created_at) AS bucket_start,
          COUNT(*)::int AS count
        FROM vehicle_views vv
        INNER JOIN vehicles v ON v.id = vv.vehicle_id
        WHERE v.profile_id = $1
          AND v.deleted_at IS NULL
          AND vv.created_at >= $2
          AND vv.created_at < $3
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      [params.profile_id, params.period_start, params.period_end],
    );

    return rows.map((row) => ({
      bucket_start: row.bucket_start.toISOString(),
      count: Number(row.count ?? 0),
    }));
  }

  async countWeeklyVisits(params: {
    profile_id: string;
    week_start: Date;
    week_end: Date;
  }): Promise<number> {
    const rows = await this.data_source.query<CountRow[]>(
      `
        SELECT COUNT(*)::int AS count
        FROM vehicle_views vv
        INNER JOIN vehicles v ON v.id = vv.vehicle_id
        WHERE v.profile_id = $1
          AND v.deleted_at IS NULL
          AND vv.created_at >= $2
          AND vv.created_at < $3
      `,
      [params.profile_id, params.week_start, params.week_end],
    );

    return Number(rows[0]?.count ?? 0);
  }

  async countWeeklyMessagesReceived(params: {
    profile_id: string;
    week_start: Date;
    week_end: Date;
  }): Promise<number> {
    const rows = await this.data_source.query<CountRow[]>(
      `
        SELECT COUNT(*)::int AS count
        FROM chat_messages cm
        INNER JOIN chats c ON c.id = cm.chat_id
        WHERE c.participants @> $1::jsonb
          AND cm.sender_id <> $2
          AND cm.deleted_at IS NULL
          AND cm.created_at >= $3
          AND cm.created_at < $4
      `,
      [
        JSON.stringify([params.profile_id]),
        params.profile_id,
        params.week_start,
        params.week_end],
    );

    return Number(rows[0]?.count ?? 0);
  }

  async getActiveInventoryRows(
    profile_id: string,
    now: Date,
  ): Promise<OwnerDashboardInventoryVehicleRow[]> {
    const rows = await this.data_source.query<InventoryRow[]>(
      `
        SELECT
          v.id AS vehicle_id,
          NULLIF(
            TRIM(CONCAT_WS(' ', make.name, model.name, ver.name)),
            ''
          ) AS title,
          COALESCE(vp.price, 0)::int AS price,
          ver.model_id::int AS model_id,
          (
            SELECT COUNT(*)::int
            FROM vehicle_images vi
            WHERE vi.vehicle_id = v.id
          ) AS image_count,
          COALESCE(LENGTH(v.description), 0)::int AS description_length,
          v.mileage::int AS mileage,
          v.is_featured,
          v.featured_expires_at,
          EXTRACT(
            EPOCH FROM (
              $2::timestamptz - GREATEST(COALESCE(v.renewed_at, v.created_at), v.created_at)
            )
          ) / 86400 AS listing_age_days
        FROM vehicles v
        INNER JOIN version ver ON ver.id = v.version_id
        INNER JOIN make ON make.id = ver.make_id
        INNER JOIN model ON model.id = ver.model_id
        LEFT JOIN vehicle_prices vp
          ON vp.vehicle_id = v.id
          AND vp.status = $3
        WHERE v.profile_id = $1
          AND v.status = $4
          AND v.deleted_at IS NULL
        ORDER BY listing_age_days DESC
      `,
      [
        profile_id,
        now,
        VEHICLE_PRICE_STATUS.ACTIVE,
        STATUS_VEHICLE.ACTIVE],
    );

    return rows.map((row) => ({
      vehicle_id: row.vehicle_id,
      display_name: row.title?.trim() || "Vehículo",
      price: Number(row.price ?? 0),
      model_id: Number(row.model_id),
      image_count: Number(row.image_count ?? 0),
      description_length: Number(row.description_length ?? 0),
      mileage: Number(row.mileage ?? 0),
      is_featured: Boolean(row.is_featured),
      featured_expires_at: row.featured_expires_at,
      listing_age_days: Number(row.listing_age_days ?? 0),
    }));
  }

  async getPriceDeviationRows(
    profile_id: string,
  ): Promise<OwnerDashboardPriceDeviationRow[]> {
    const rows = await this.data_source.query<PriceDeviationRow[]>(
      `
        WITH model_benchmarks AS (
          SELECT
            ver.model_id,
            AVG(vp.price)::numeric AS benchmark_price,
            COUNT(*)::int AS sample_count
          FROM vehicles v
          INNER JOIN version ver ON ver.id = v.version_id
          INNER JOIN vehicle_prices vp
            ON vp.vehicle_id = v.id
            AND vp.status = $2
          WHERE v.status = $3
            AND v.deleted_at IS NULL
          GROUP BY ver.model_id
          HAVING COUNT(*) >= 3
        ),
        owner_active AS (
          SELECT
            v.id AS vehicle_id,
            NULLIF(
              TRIM(CONCAT_WS(' ', make.name, model.name, ver.name)),
              ''
            ) AS title,
            vp.price::numeric AS price,
            ver.model_id
          FROM vehicles v
          INNER JOIN version ver ON ver.id = v.version_id
          INNER JOIN make ON make.id = ver.make_id
          INNER JOIN model ON model.id = ver.model_id
          INNER JOIN vehicle_prices vp
            ON vp.vehicle_id = v.id
            AND vp.status = $2
          WHERE v.profile_id = $1
            AND v.status = $3
            AND v.deleted_at IS NULL
            AND vp.price > 0
        )
        SELECT
          oa.vehicle_id,
          oa.title,
          oa.price::int AS price,
          mb.benchmark_price::int AS benchmark_price,
          ROUND(
            ((oa.price - mb.benchmark_price) / mb.benchmark_price) * 100,
            1
          )::numeric AS deviation_percent
        FROM owner_active oa
        INNER JOIN model_benchmarks mb ON mb.model_id = oa.model_id
        WHERE ABS(((oa.price - mb.benchmark_price) / mb.benchmark_price) * 100) > 5
        ORDER BY deviation_percent DESC
      `,
      [profile_id, VEHICLE_PRICE_STATUS.ACTIVE, STATUS_VEHICLE.ACTIVE],
    );

    return rows.map((row) => ({
      vehicle_id: row.vehicle_id,
      display_name: row.title?.trim() || "Vehículo",
      price: Number(row.price ?? 0),
      benchmark_price: Number(row.benchmark_price ?? 0),
      deviation_percent: Number(row.deviation_percent ?? 0),
    }));
  }

  async countDealershipReviews(dealership_id: string): Promise<number> {
    const rows = await this.data_source.query<CountRow[]>(
      `
        SELECT COUNT(*)::int AS count
        FROM dealership_reviews
        WHERE dealership_id = $1
      `,
      [dealership_id],
    );

    return Number(rows[0]?.count ?? 0);
  }
}
