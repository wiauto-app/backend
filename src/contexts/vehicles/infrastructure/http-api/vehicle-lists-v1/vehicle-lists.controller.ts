import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AddVehicleListItemUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/add-vehicle-list-item-use-case/add-vehicle-list-item.use-case";
import { CreateVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/create-vehicle-list-use-case/create-vehicle-list.use-case";
import { DeleteVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/delete-vehicle-list-use-case/delete-vehicle-list.use-case";
import { FindAllVehicleListsUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/find-all-vehicle-lists-use-case/find-all-vehicle-lists.use-case";
import { FindVehicleListItemsUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/find-vehicle-list-items-use-case/find-vehicle-list-items.use-case";
import { FindVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/find-vehicle-list-use-case/find-vehicle-list.use-case";
import { RemoveVehicleListItemUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/remove-vehicle-list-item-use-case/remove-vehicle-list-item.use-case";
import { UpdateVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/update-vehicle-list-use-case/update-vehicle-list.use-case";

import { V1_VEHICLE_LISTS } from "../route.constants";
import { AddVehicleListItemHttpDto } from "./add-vehicle-list-item.http-dto";
import { CreateVehicleListHttpDto } from "./create-vehicle-list.http-dto";
import { UpdateVehicleListHttpDto } from "./update-vehicle-list.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class VehicleListsController {
  constructor(
    private readonly create_vehicle_list_use_case: CreateVehicleListUseCase,
    private readonly find_all_vehicle_lists_use_case: FindAllVehicleListsUseCase,
    private readonly find_vehicle_list_use_case: FindVehicleListUseCase,
    private readonly update_vehicle_list_use_case: UpdateVehicleListUseCase,
    private readonly delete_vehicle_list_use_case: DeleteVehicleListUseCase,
    private readonly add_vehicle_list_item_use_case: AddVehicleListItemUseCase,
    private readonly remove_vehicle_list_item_use_case: RemoveVehicleListItemUseCase,
    private readonly find_vehicle_list_items_use_case: FindVehicleListItemsUseCase,
  ) {}

  @Post()
  create(
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

  @Get()
  findAll(@GetUserId() profile_id: string) {
    return this.find_all_vehicle_lists_use_case.execute({ profile_id });
  }

  @Get(":list_id/items")
  findItems(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
  ) {
    return this.find_vehicle_list_items_use_case.execute({
      list_id,
      profile_id,
    });
  }

  @Get(":list_id")
  findOne(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
  ) {
    return this.find_vehicle_list_use_case.execute({ list_id, profile_id });
  }

  @Patch(":list_id")
  update(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
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

  @Delete(":list_id")
  remove(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
  ) {
    return this.delete_vehicle_list_use_case.execute({ list_id, profile_id });
  }

  @Post(":list_id/items")
  addItem(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
    @Body() body: AddVehicleListItemHttpDto,
  ) {
    return this.add_vehicle_list_item_use_case.execute({
      list_id,
      profile_id,
      vehicle_id: body.vehicle_id,
    });
  }

  @Delete(":list_id/items/:vehicle_id")
  removeItem(
    @GetUserId() profile_id: string,
    @Param("list_id", ParseUUIDPipe) list_id: string,
    @Param("vehicle_id", ParseUUIDPipe) vehicle_id: string,
  ) {
    return this.remove_vehicle_list_item_use_case.execute({
      list_id,
      profile_id,
      vehicle_id,
    });
  }
}
