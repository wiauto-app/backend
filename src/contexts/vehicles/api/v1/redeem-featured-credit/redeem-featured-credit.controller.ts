import { Controller, Param, Post } from "@nestjs/common";

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
export class RedeemFeaturedCreditController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Post(":id/feature/redeem")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string) {
    return this.vehicle_service.redeemFeaturedCredit({ vehicle_id: id });
  }
}
