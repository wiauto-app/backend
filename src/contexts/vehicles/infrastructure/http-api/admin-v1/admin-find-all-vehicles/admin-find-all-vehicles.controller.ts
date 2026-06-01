import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { V1_ADMIN_VEHICLES } from "../../route.constants";
import { AdminFindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-find-all-vehicles-use-case/admin-find-all-vehicles.use-case";
import { AdminFindAllVehiclesHttpDto } from "./admin-find-all-vehicles.http-dto";

@Controller(V1_ADMIN_VEHICLES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminFindAllVehiclesController {

  constructor(private readonly adminFindAllVehiclesUseCase: AdminFindAllVehiclesUseCase) {}

  @Get()
  run(@Query() adminFindAllVehiclesHttpDto: AdminFindAllVehiclesHttpDto) {
    return this.adminFindAllVehiclesUseCase.execute(adminFindAllVehiclesHttpDto);
  }
}