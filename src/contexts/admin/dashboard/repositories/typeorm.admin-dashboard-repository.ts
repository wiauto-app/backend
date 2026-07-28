import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { SUBSCRIPTION_STATUS } from "@/src/contexts/billing/types/billing.enums";
import { ReportStatus } from "@/src/contexts/reports/types/report";
import { TicketStatus } from "@/src/contexts/support/types/ticket";
import {
  APPRAISAL_REQUEST_PRIORITY,
  APPRAISAL_REQUEST_STATUS,
} from "@/src/contexts/vehicles/appraisal-requests/types/appraisal-request";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

import type {
  AdminDashboardCommercialRaw,
  AdminDashboardKpisRaw,
  AdminDashboardQueuesRaw,
  AdminDashboardTimeSeriesRawRow,
} from "../types/admin-dashboard";

interface KpisRow {
  active_vehicles_current: string;
  active_vehicles_previous: string;
  pending_vehicles_current: string;
  pending_vehicles_previous: string;
  new_users_current: string;
  new_users_previous: string;
  leads_current: string;
  leads_previous: string;
  active_subscriptions_current: string;
  active_subscriptions_previous: string;
}

interface QueuesRow {
  pending_vehicles: string;
  open_reports: string;
  pending_appraisals: string;
  high_priority_appraisals: string;
  plan_lead_requests: string;
  open_tickets: string;
}

interface StatusCountRow {
  status: string;
  count: string;
}

interface CommercialRow {
  appraisals_resolved: string;
  appraisals_pending: string;
}

interface TimeSeriesRow {
  bucket_start: Date;
  new_users: string;
  new_vehicles: string;
  views: string;
  impressions: string;
  leads: string;
}

const toNumber = (value: string | null | undefined): number => Number(value ?? 0);

@Injectable()
export class TypeOrmAdminDashboardRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getKpis(params: {
    currentStart: Date;
    previousStart: Date;
    periodEnd: Date;
  }): Promise<AdminDashboardKpisRaw> {
    const rows = await this.dataSource.query<KpisRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.status = $4
              AND v.deleted_at IS NULL
          ) AS active_vehicles_current,
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.status = $4
              AND v.deleted_at IS NULL
              AND v.created_at < $1
          ) AS active_vehicles_previous,
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.status = $5
              AND v.deleted_at IS NULL
          ) AS pending_vehicles_current,
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.status = $5
              AND v.deleted_at IS NULL
              AND v.created_at < $1
          ) AS pending_vehicles_previous,
          (
            SELECT COUNT(*)::int
            FROM users u
            WHERE u.deleted_at IS NULL
              AND u.created_at >= $1
              AND u.created_at < $3
          ) AS new_users_current,
          (
            SELECT COUNT(*)::int
            FROM users u
            WHERE u.deleted_at IS NULL
              AND u.created_at >= $2
              AND u.created_at < $1
          ) AS new_users_previous,
          (
            SELECT COUNT(*)::int
            FROM leads l
            WHERE l.created_at >= $1
              AND l.created_at < $3
          ) AS leads_current,
          (
            SELECT COUNT(*)::int
            FROM leads l
            WHERE l.created_at >= $2
              AND l.created_at < $1
          ) AS leads_previous,
          (
            SELECT COUNT(*)::int
            FROM subscriptions s
            WHERE s.status = $6
          ) AS active_subscriptions_current,
          (
            SELECT COUNT(*)::int
            FROM subscriptions s
            WHERE s.status = $6
              AND s.created_at < $1
          ) AS active_subscriptions_previous
      `,
      [
        params.currentStart,
        params.previousStart,
        params.periodEnd,
        STATUS_VEHICLE.ACTIVE,
        STATUS_VEHICLE.PENDING,
        SUBSCRIPTION_STATUS.ACTIVE,
      ],
    );

    const row = rows[0];

    return {
      active_vehicles_current: toNumber(row?.active_vehicles_current),
      active_vehicles_previous: toNumber(row?.active_vehicles_previous),
      pending_vehicles_current: toNumber(row?.pending_vehicles_current),
      pending_vehicles_previous: toNumber(row?.pending_vehicles_previous),
      new_users_current: toNumber(row?.new_users_current),
      new_users_previous: toNumber(row?.new_users_previous),
      leads_current: toNumber(row?.leads_current),
      leads_previous: toNumber(row?.leads_previous),
      active_subscriptions_current: toNumber(row?.active_subscriptions_current),
      active_subscriptions_previous: toNumber(
        row?.active_subscriptions_previous,
      ),
    };
  }

  async getQueues(): Promise<AdminDashboardQueuesRaw> {
    const rows = await this.dataSource.query<QueuesRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM vehicles v
            WHERE v.status = $1
              AND v.deleted_at IS NULL
          ) AS pending_vehicles,
          (
            SELECT COUNT(*)::int
            FROM reports r
            WHERE r.status IN ($2, $3)
          ) AS open_reports,
          (
            SELECT COUNT(*)::int
            FROM appraisal_requests ar
            WHERE ar.status = $4
          ) AS pending_appraisals,
          (
            SELECT COUNT(*)::int
            FROM appraisal_requests ar
            WHERE ar.status = $4
              AND ar.priority = $5
          ) AS high_priority_appraisals,
          (
            SELECT COUNT(*)::int
            FROM plan_lead_requests
          ) AS plan_lead_requests,
          (
            SELECT COUNT(*)::int
            FROM tickets t
            WHERE t.status IN ($6, $7, $8)
          ) AS open_tickets
      `,
      [
        STATUS_VEHICLE.PENDING,
        ReportStatus.OPEN,
        ReportStatus.IN_REVIEW,
        APPRAISAL_REQUEST_STATUS.PENDING,
        APPRAISAL_REQUEST_PRIORITY.HIGH,
        TicketStatus.OPEN,
        TicketStatus.PENDING,
        TicketStatus.IN_PROGRESS,
      ],
    );

    const row = rows[0];

    return {
      pending_vehicles: toNumber(row?.pending_vehicles),
      open_reports: toNumber(row?.open_reports),
      pending_appraisals: toNumber(row?.pending_appraisals),
      high_priority_appraisals: toNumber(row?.high_priority_appraisals),
      plan_lead_requests: toNumber(row?.plan_lead_requests),
      open_tickets: toNumber(row?.open_tickets),
    };
  }

  async getInventoryByStatus(): Promise<Record<string, number>> {
    const rows = await this.dataSource.query<StatusCountRow[]>(
      `
        SELECT v.status, COUNT(*)::int AS count
        FROM vehicles v
        WHERE v.deleted_at IS NULL
        GROUP BY v.status
        ORDER BY v.status ASC
      `,
    );

    const inventory: Record<string, number> = {};

    for (const row of rows) {
      inventory[row.status] = toNumber(row.count);
    }

    return inventory;
  }

  async getCommercial(): Promise<AdminDashboardCommercialRaw> {
    const [subscriptionRows, commercialRows] = await Promise.all([
      this.dataSource.query<StatusCountRow[]>(
        `
          SELECT s.status, COUNT(*)::int AS count
          FROM subscriptions s
          GROUP BY s.status
          ORDER BY s.status ASC
        `,
      ),
      this.dataSource.query<CommercialRow[]>(
        `
          SELECT
            (
              SELECT COUNT(*)::int
              FROM appraisal_requests ar
              WHERE ar.status = $1
            ) AS appraisals_resolved,
            (
              SELECT COUNT(*)::int
              FROM appraisal_requests ar
              WHERE ar.status = $2
            ) AS appraisals_pending
        `,
        [APPRAISAL_REQUEST_STATUS.ANSWERED, APPRAISAL_REQUEST_STATUS.PENDING],
      ),
    ]);

    const subscriptionsByStatus: Record<string, number> = {};

    for (const row of subscriptionRows) {
      subscriptionsByStatus[row.status] = toNumber(row.count);
    }

    const commercial = commercialRows[0];

    return {
      subscriptions_by_status: subscriptionsByStatus,
      appraisals_resolved: toNumber(commercial?.appraisals_resolved),
      appraisals_pending: toNumber(commercial?.appraisals_pending),
    };
  }

  async getTimeSeries(params: {
    periodStart: Date;
    periodEnd: Date;
    granularity: string;
    stepInterval: string;
  }): Promise<AdminDashboardTimeSeriesRawRow[]> {
    const rows = await this.dataSource.query<TimeSeriesRow[]>(
      `
        WITH buckets AS (
          SELECT generate_series(
            date_trunc($3, $1::timestamptz),
            date_trunc($3, ($2::timestamptz - interval '1 second')),
            $4::interval
          ) AS bucket_start
        ),
        users_agg AS (
          SELECT
            date_trunc($3, u.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM users u
          WHERE u.deleted_at IS NULL
            AND u.created_at >= $1
            AND u.created_at < $2
          GROUP BY 1
        ),
        vehicles_agg AS (
          SELECT
            date_trunc($3, v.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicles v
          WHERE v.deleted_at IS NULL
            AND v.created_at >= $1
            AND v.created_at < $2
          GROUP BY 1
        ),
        views_agg AS (
          SELECT
            date_trunc($3, vv.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicle_views vv
          WHERE vv.created_at >= $1
            AND vv.created_at < $2
          GROUP BY 1
        ),
        impressions_agg AS (
          SELECT
            date_trunc($3, vi.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM vehicle_impressions vi
          WHERE vi.created_at >= $1
            AND vi.created_at < $2
          GROUP BY 1
        ),
        leads_agg AS (
          SELECT
            date_trunc($3, l.created_at) AS bucket_start,
            COUNT(*)::int AS count
          FROM leads l
          WHERE l.created_at >= $1
            AND l.created_at < $2
          GROUP BY 1
        )
        SELECT
          b.bucket_start,
          COALESCE(u.count, 0) AS new_users,
          COALESCE(v.count, 0) AS new_vehicles,
          COALESCE(vv.count, 0) AS views,
          COALESCE(i.count, 0) AS impressions,
          COALESCE(l.count, 0) AS leads
        FROM buckets b
        LEFT JOIN users_agg u ON u.bucket_start = b.bucket_start
        LEFT JOIN vehicles_agg v ON v.bucket_start = b.bucket_start
        LEFT JOIN views_agg vv ON vv.bucket_start = b.bucket_start
        LEFT JOIN impressions_agg i ON i.bucket_start = b.bucket_start
        LEFT JOIN leads_agg l ON l.bucket_start = b.bucket_start
        ORDER BY b.bucket_start ASC
      `,
      [
        params.periodStart,
        params.periodEnd,
        params.granularity,
        params.stepInterval,
      ],
    );

    return rows.map((row) => ({
      bucket_start: row.bucket_start.toISOString(),
      new_users: toNumber(row.new_users),
      new_vehicles: toNumber(row.new_vehicles),
      views: toNumber(row.views),
      impressions: toNumber(row.impressions),
      leads: toNumber(row.leads),
    }));
  }
}
