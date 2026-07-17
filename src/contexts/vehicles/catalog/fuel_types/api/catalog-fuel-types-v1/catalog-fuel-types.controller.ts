import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { V1_CATALOG_FUEL_TYPES } from "../../../route.constants";
import { CatalogFuelTypesService } from "../../services/catalog-fuel-types.service";
import { CreateCatalogFuelTypeHttpDto } from "./dto/create-catalog-fuel-type.http-dto";
import { UpdateCatalogFuelTypeHttpDto } from "./update-catalog-fuel-type.http-dto";
import { FindAllFuelTypesHttpDto } from "./dto/find-all-fuel-types.http-dto";

@Controller(V1_CATALOG_FUEL_TYPES)
export class CatalogFuelTypesController {
  constructor(private readonly catalog_fuel_types_service: CatalogFuelTypesService) {}

  @Post()
  create(@Body() dto: CreateCatalogFuelTypeHttpDto) {
    return this.catalog_fuel_types_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogFuelTypeHttpDto,
  ) {
    return this.catalog_fuel_types_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllFuelTypesHttpDto) {
    return this.catalog_fuel_types_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_fuel_types_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_fuel_types_service.remove(id);
  }
}
