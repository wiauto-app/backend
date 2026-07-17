import type { VehiclePeriodCounts } from "../types/vehicle-period-counts";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import type { ContactClickType } from "../types/contact-click";
type PeriodCountRow = {
  vehicle_id: string;
  current: string;
  previous: string;
};

const map_period_rows = (rows: PeriodCountRow[]): VehiclePeriodCounts[] =>
  rows.map((row) => ({
    vehicle_id: row.vehicle_id,
    current: Number(row.current ?? 0),
    previous: Number(row.previous ?? 0),
  }));

@Injectable()
export class TypeOrmVehicleAnalyticsRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {
  }

  private async countByTable(
    table: string,
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    if (vehicle_ids.length === 0) {
      return [];
    }

    const rows = await this.data_source.query<PeriodCountRow[]>(
      `
        SELECT
          vehicle_id,
          COUNT(*) FILTER (
            WHERE created_at >= $2 AND created_at < $4
          )::int AS current,
          COUNT(*) FILTER (
            WHERE created_at >= $3 AND created_at < $2
          )::int AS previous
        FROM ${table}
        WHERE vehicle_id = ANY($1::uuid[])
        GROUP BY vehicle_id
      `,
      [vehicle_ids, current_start, previous_start, period_end],
    );

    return map_period_rows(rows);
  }

  async countViewsByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    return this.countByTable(
      "vehicle_views",
      vehicle_ids,
      current_start,
      previous_start,
      period_end,
    );
  }

  async countSharesByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    return this.countByTable(
      "vehicle_shares",
      vehicle_ids,
      current_start,
      previous_start,
      period_end,
    );
  }

  async countLeadsByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    return this.countByTable(
      "leads",
      vehicle_ids,
      current_start,
      previous_start,
      period_end,
    );
  }

  async countFavoritesByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    if (vehicle_ids.length === 0) {
      return [];
    }

    const rows = await this.data_source.query<PeriodCountRow[]>(
      `
        SELECT
          vehicle_id,
          COUNT(*) FILTER (
            WHERE created_at >= $2 AND created_at < $4
          )::int AS current,
          COUNT(*) FILTER (
            WHERE created_at >= $3 AND created_at < $2
          )::int AS previous
        FROM vehicle_list_items
        WHERE vehicle_id = ANY($1::uuid[])
        GROUP BY vehicle_id
      `,
      [vehicle_ids, current_start, previous_start, period_end],
    );

    return map_period_rows(rows);
  }

  async countContactClicksByVehicleIdsInPeriods(
    vehicle_ids: string[],
    type: ContactClickType,
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]> {
    if (vehicle_ids.length === 0) {
      return [];
    }

    const rows = await this.data_source.query<PeriodCountRow[]>(
      `
        SELECT
          vehicle_id,
          COUNT(*) FILTER (
            WHERE created_at >= $2 AND created_at < $5
          )::int AS current,
          COUNT(*) FILTER (
            WHERE created_at >= $3 AND created_at < $2
          )::int AS previous
        FROM vehicle_contact_clicks
        WHERE vehicle_id = ANY($1::uuid[])
          AND type = $4
        GROUP BY vehicle_id
      `,
      [vehicle_ids, current_start, previous_start, type, period_end],
    );

    return map_period_rows(rows);
  }
}
