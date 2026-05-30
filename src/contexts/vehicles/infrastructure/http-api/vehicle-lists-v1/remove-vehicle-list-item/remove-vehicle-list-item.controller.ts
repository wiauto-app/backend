import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RemoveVehicleListItemUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/remove-vehicle-list-item-use-case/remove-vehicle-list-item.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class RemoveVehicleListItemController {
  constructor(
    private readonly remove_vehicle_list_item_use_case: RemoveVehicleListItemUseCase,
  ) {}

  @Delete(":list_id/items/:vehicle_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
  ) {
    return this.remove_vehicle_list_item_use_case.execute({
      list_id,
      profile_id,
      vehicle_id,
    });
  }
}
