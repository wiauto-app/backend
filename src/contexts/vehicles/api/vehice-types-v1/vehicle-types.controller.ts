import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { VehicleTypesService } from "../../services/vehicle-types.service";
import { V1_VEHICLE_TYPES } from "../route.constants";
import { CreateVehicleTypeHttpDto } from "./dto/create-vehicle-type.http-dto";
import { UpdateVehicleTypeHttpDto } from "./update-vehicle-type.http-dto";

@Controller(V1_VEHICLE_TYPES)
export class VehicleTypesController {
  constructor(private readonly vehicle_types_service: VehicleTypesService) {}

  @Post()
  create(@Body() create_vehicle_type_http_dto: CreateVehicleTypeHttpDto) {
    return this.vehicle_types_service.create(create_vehicle_type_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_vehicle_type_http_dto: UpdateVehicleTypeHttpDto,
  ) {
    return this.vehicle_types_service.update(id, {
      name: update_vehicle_type_http_dto.name,
      image_url: update_vehicle_type_http_dto.image_url,
    });
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.vehicle_types_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vehicle_types_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vehicle_types_service.remove(id);
  }
}
