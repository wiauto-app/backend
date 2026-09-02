import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class FindVehicleListItemsController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Get(":list_id/items")
  run(
    @GetUserId() profileId: string,
    @Param("list_id", new ParseUUIDPipe()) listId: string,
    @Query() query: PaginationHttpDto,
  ) {
    return this.vehicle_lists_service.findItems({
      listId,
      profileId,
      page: query.page,
      limit: query.limit,
    });
  }
}
