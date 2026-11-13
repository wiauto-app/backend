import { Body, Controller, Param, ParseUUIDPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateVehicleHttpDto } from "./update-vehicle.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/guards/vehicle-owner.guard";
import { EntitlementGuard } from "@/src/contexts/billing/guards/entitlement.guard";
import { User } from "@/src/contexts/users/entities/user.entity";

@Controller(V1_VEHICLES)
export class UpdateVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Patch(":id")
  @UseGuards(JwtGuard, VehicleOwnerGuard,EntitlementGuard)
  run(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateVehicleHttpDto,
    @Req() req: Request & { user?: User },
  ) {
    // El usuario es dueño de los vídeos multipart nuevos que adjunta
    return this.vehicle_service.update({ id, ...body }, req.user?.id);
  }
}
