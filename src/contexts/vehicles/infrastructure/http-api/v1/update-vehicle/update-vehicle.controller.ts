import { Body, Controller, Param, Patch } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateVehicleUseCase } from "@/src/contexts/vehicles/application/update-vehicle-use-case/update-vehicle.use-case";
import { UpdateVehicleHttpDto } from "./update-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class UpdateVehicleController {
  constructor(private readonly updateVehicleUseCase: UpdateVehicleUseCase) {}

  @Patch(":id")
  run(@Param("id") id: string, @Body() body: UpdateVehicleHttpDto) {
    return this.updateVehicleUseCase.execute({ id, ...body });
  }
}
