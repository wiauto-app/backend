import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmAdminDashboardRepository } from "../repositories/typeorm.admin-dashboard-repository";
import type { AdminDashboardResponse } from "../types/admin-dashboard";
import {
  AdminDashboardDateRangeError,
  resolveAdminDashboardDateRangeBounds,
} from "../utils/admin-dashboard-rules";

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly adminDashboardRepository: TypeOrmAdminDashboardRepository,
  ) {}

  async getDashboard(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AdminDashboardResponse> {
    let bounds;

    try {
      bounds = resolveAdminDashboardDateRangeBounds({
        startDate: params?.startDate,
        endDate: params?.endDate,
      });
    } catch (error) {
      if (error instanceof AdminDashboardDateRangeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const [kpisRaw, queuesRaw, inventoryByStatus, timeSeriesRaw, commercialRaw] =
      await Promise.all([
        this.adminDashboardRepository.getKpis({
          currentStart: bounds.currentStart,
          previousStart: bounds.previousStart,
          periodEnd: bounds.periodEnd,
        }),
        this.adminDashboardRepository.getQueues(),
        this.adminDashboardRepository.getInventoryByStatus(),
        this.adminDashboardRepository.getTimeSeries({
          periodStart: bounds.currentStart,
          periodEnd: bounds.periodEnd,
          granularity: bounds.granularity,
          stepInterval: bounds.stepInterval,
        }),
        this.adminDashboardRepository.getCommercial(),
      ]);

    return {
      period: {
        days: bounds.days,
        start: bounds.start.toISOString(),
        end: bounds.end.toISOString(),
        granularity: bounds.granularity,
      },
      kpis: {
        activeVehicles: {
          current: kpisRaw.active_vehicles_current,
          previous: kpisRaw.active_vehicles_previous,
        },
        pendingVehicles: {
          current: kpisRaw.pending_vehicles_current,
          previous: kpisRaw.pending_vehicles_previous,
        },
        newUsers: {
          current: kpisRaw.new_users_current,
          previous: kpisRaw.new_users_previous,
        },
        leads: {
          current: kpisRaw.leads_current,
          previous: kpisRaw.leads_previous,
        },
        activeSubscriptions: {
          current: kpisRaw.active_subscriptions_current,
          previous: kpisRaw.active_subscriptions_previous,
        },
      },
      queues: {
        pendingVehicles: queuesRaw.pending_vehicles,
        openReports: queuesRaw.open_reports,
        pendingAppraisals: queuesRaw.pending_appraisals,
        highPriorityAppraisals: queuesRaw.high_priority_appraisals,
        planLeadRequests: queuesRaw.plan_lead_requests,
        openTickets: queuesRaw.open_tickets,
      },
      timeSeries: timeSeriesRaw.map((row) => ({
        bucketStart: row.bucket_start,
        newUsers: row.new_users,
        newVehicles: row.new_vehicles,
        views: row.views,
        impressions: row.impressions,
        leads: row.leads,
      })),
      inventoryByStatus,
      commercial: {
        subscriptionsByStatus: commercialRaw.subscriptions_by_status,
        appraisalsResolved: commercialRaw.appraisals_resolved,
        appraisalsPending: commercialRaw.appraisals_pending,
      },
    };
  }
}
