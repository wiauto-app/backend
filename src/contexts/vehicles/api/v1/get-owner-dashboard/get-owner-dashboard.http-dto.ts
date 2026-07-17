import { IsIn, IsOptional } from "class-validator";

import {
  DEFAULT_OWNER_DASHBOARD_PERIOD,
  OWNER_DASHBOARD_PERIOD_CODES,
} from "@/src/contexts/vehicles/utils/owner-dashboard-rules";
import type { OwnerDashboardPeriodCode } from "@/src/contexts/vehicles/types/owner-dashboard";

export class GetOwnerDashboardHttpDto {
  @IsOptional()
  @IsIn(OWNER_DASHBOARD_PERIOD_CODES)
  period?: OwnerDashboardPeriodCode = DEFAULT_OWNER_DASHBOARD_PERIOD;
}
