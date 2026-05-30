import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AddVehicleListItemUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/add-vehicle-list-item-use-case/add-vehicle-list-item.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { AddVehicleListItemHttpDto } from "./add-vehicle-list-item.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class AddVehicleListItemController {
  constructor(
    private readonly add_vehicle_list_item_use_case: AddVehicleListItemUseCase,
  ) {}

  @Post(":list_id/items")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Body() body: AddVehicleListItemHttpDto,
  ) {
    return this.add_vehicle_list_item_use_case.execute({
      list_id,
      profile_id,
      vehicle_id: body.vehicle_id,
    });
  }
}
