import { Controller, Get, Query } from "@nestjs/common";
import { V1_ADMIN_VEHICLES } from "../../route.constants";
import { AdminFindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-find-all-vehicles-use-case/admin-find-all-vehicles.use-case";
import { AdminFindAllVehiclesHttpDto } from "./admin-find-all-vehicles.http-dto";

@Controller(V1_ADMIN_VEHICLES)
export class AdminFindAllVehiclesController {

  constructor(private readonly adminFindAllVehiclesUseCase: AdminFindAllVehiclesUseCase) {}

  @Get()
  run(@Query() adminFindAllVehiclesHttpDto: AdminFindAllVehiclesHttpDto) {
    return this.adminFindAllVehiclesUseCase.execute(adminFindAllVehiclesHttpDto);
  }
}