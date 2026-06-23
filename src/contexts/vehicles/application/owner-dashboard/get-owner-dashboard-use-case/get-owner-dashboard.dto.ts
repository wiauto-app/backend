import type { OwnerDashboardPeriodCode } from "../../../domain/read-models/owner-dashboard";

export interface GetOwnerDashboardDto {
  profile_id: string;
  period: OwnerDashboardPeriodCode;
}
