import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { RequireEntitlement } from "@/src/contexts/billing/decorators/require-entitlement.decorator";
import { EntitlementGuard } from "@/src/contexts/billing/guards/entitlement.guard";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";

import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { VehicleInsightsService } from "../../../services/vehicle-insights.service";
import type { VehicleInsights } from "../../../types/vehicle-insights";
import { V1_VEHICLES, V1_VEHICLES_INSIGHTS } from "../../route.constants";

@Controller(V1_VEHICLES)
export class GetVehicleInsightsController {
  constructor(private readonly vehicle_insights_service: VehicleInsightsService) {}

  @Get(`:id/${V1_VEHICLES_INSIGHTS}`)
  @OwnerVehicleActionAuth()
  @UseGuards(EntitlementGuard)
  @RequireEntitlement(ENTITLEMENT_FEATURE.LISTING_INSIGHTS)
  run(@Param("id", ParseUUIDPipe) id: string): Promise<VehicleInsights> {
    return this.vehicle_insights_service.getInsights(id);
  }
}
