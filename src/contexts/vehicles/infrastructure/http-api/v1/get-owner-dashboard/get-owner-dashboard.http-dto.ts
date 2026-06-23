import { IsIn, IsOptional } from "class-validator";

import {
  DEFAULT_OWNER_DASHBOARD_PERIOD,
  OWNER_DASHBOARD_PERIOD_CODES,
} from "@/src/contexts/vehicles/domain/utils/owner-dashboard-rules";
import type { OwnerDashboardPeriodCode } from "@/src/contexts/vehicles/domain/read-models/owner-dashboard";

export class GetOwnerDashboardHttpDto {
  @IsOptional()
  @IsIn(OWNER_DASHBOARD_PERIOD_CODES)
  period?: OwnerDashboardPeriodCode = DEFAULT_OWNER_DASHBOARD_PERIOD;
}
