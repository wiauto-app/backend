import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { V1_VEHICLE_TYPES } from "../route.constants";
import { VehicleTypesUseCase } from "../../../application/vehicle-types-use-cases/vehicle-types.use-case";
import { CreateVehicleTypeHttpDto } from "./dto/create-vehicle-type.http-dto";
import { UpdateVehicleTypeHttpDto } from "./update-vehicle-type.http-dto";

@Controller(V1_VEHICLE_TYPES)
export class VehicleTypesController {
  constructor(private readonly vehicleTypesUseCase: VehicleTypesUseCase) { }

  @Post()
  create(@Body() createVehicleTypeHttpDto: CreateVehicleTypeHttpDto) {
    return this.vehicleTypesUseCase.create(createVehicleTypeHttpDto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateVehicleTypeHttpDto: UpdateVehicleTypeHttpDto) {
    return this.vehicleTypesUseCase.update(id, {
      name: updateVehicleTypeHttpDto.name,
    });
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.vehicleTypesUseCase.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vehicleTypesUseCase.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vehicleTypesUseCase.remove(id);
  }
}