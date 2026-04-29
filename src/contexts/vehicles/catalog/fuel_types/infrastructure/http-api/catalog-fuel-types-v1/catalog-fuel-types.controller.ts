import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { V1_CATALOG_FUEL_TYPES } from "../../../../route.constants";
import { CatalogFuelTypesUseCase } from "../../../application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";
import { CreateCatalogFuelTypeHttpDto } from "./dto/create-catalog-fuel-type.http-dto";
import { UpdateCatalogFuelTypeHttpDto } from "./update-catalog-fuel-type.http-dto";

@Controller(V1_CATALOG_FUEL_TYPES)
export class CatalogFuelTypesController {
  constructor(private readonly use_case: CatalogFuelTypesUseCase) {}

  @Post()
  create(@Body() dto: CreateCatalogFuelTypeHttpDto) {
    return this.use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogFuelTypeHttpDto,
  ) {
    return this.use_case.update(id, dto);
  }

  @Get()
  findAll() {
    return this.use_case.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.use_case.remove(id);
  }
}
