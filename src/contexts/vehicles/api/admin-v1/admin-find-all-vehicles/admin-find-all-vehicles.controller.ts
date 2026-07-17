import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { V1_ADMIN_VEHICLES } from "../../route.constants";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { AdminFindAllVehiclesHttpDto } from "./admin-find-all-vehicles.http-dto";

@Controller(V1_ADMIN_VEHICLES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllVehiclesController {

  constructor(private readonly vehicle_service: VehicleService) {}

  @Get()
  run(@Query() adminFindAllVehiclesHttpDto: AdminFindAllVehiclesHttpDto) {
    return this.vehicle_service.adminFindAll(adminFindAllVehiclesHttpDto);
  }
}