import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { UpdateVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/update-vehicle-list-use-case/update-vehicle-list.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { UpdateVehicleListHttpDto } from "./update-vehicle-list.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class UpdateVehicleListController {
  constructor(
    private readonly update_vehicle_list_use_case: UpdateVehicleListUseCase,
  ) {}

  @Patch(":list_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Body() body: UpdateVehicleListHttpDto,
  ) {
    return this.update_vehicle_list_use_case.execute({
      list_id,
      profile_id,
      name: body.name,
      description: body.description,
      is_default: body.is_default,
    });
  }
}
