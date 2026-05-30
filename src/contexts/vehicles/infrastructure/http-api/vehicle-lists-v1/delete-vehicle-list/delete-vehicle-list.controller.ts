import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DeleteVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/delete-vehicle-list-use-case/delete-vehicle-list.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class DeleteVehicleListController {
  constructor(
    private readonly delete_vehicle_list_use_case: DeleteVehicleListUseCase,
  ) {}

  @Delete(":list_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
  ) {
    return this.delete_vehicle_list_use_case.execute({ list_id, profile_id });
  }
}
