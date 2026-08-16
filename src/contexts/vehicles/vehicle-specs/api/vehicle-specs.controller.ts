import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { VehicleSpecs, VehicleSpecsService } from "../services/vehicle-specs.service";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VEHICLE_SPECS_ROUTE } from "../route.constants";


@Controller(VEHICLE_SPECS_ROUTE)
export class VehicleSpecsController {
  constructor(
    private readonly vehicleSpecsService: VehicleSpecsService,
  ) {}

  @Get(":versionId")
  @UseGuards(JwtGuard)
  async getVehicleSpecs(@Param("versionId", ParseIntPipe) versionId: number): Promise<VehicleSpecs> {
    return await this.vehicleSpecsService.getVehicleSpecs(versionId);
  }
}