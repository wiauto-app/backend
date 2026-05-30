import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/create-vehicle-list-use-case/create-vehicle-list.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { CreateVehicleListHttpDto } from "./create-vehicle-list.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class CreateVehicleListController {
  constructor(
    private readonly create_vehicle_list_use_case: CreateVehicleListUseCase,
  ) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateVehicleListHttpDto,
  ) {
    return this.create_vehicle_list_use_case.execute({
      profile_id,
      name: body.name,
      description: body.description,
      is_default: body.is_default,
    });
  }
}
