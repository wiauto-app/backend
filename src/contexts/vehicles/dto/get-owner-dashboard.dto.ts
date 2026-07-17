import type { OwnerDashboardPeriodCode } from "../types/owner-dashboard";

export interface GetOwnerDashboardDto {
  profile_id: string;
  period: OwnerDashboardPeriodCode;
}
