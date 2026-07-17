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
import { V1_CATALOG_YEARS } from "../../../route.constants";
import { CatalogYearsService } from "../../services/catalog-years.service";
import { CreateCatalogYearHttpDto } from "./dto/create-catalog-year.http-dto";
import { UpdateCatalogYearHttpDto } from "./update-catalog-year.http-dto";
import { FindAllYearsHttpDto } from "./dto/find-all-years.http-dto";

@Controller(V1_CATALOG_YEARS)
export class CatalogYearsController {
  constructor(private readonly catalog_years_service: CatalogYearsService) {}

  @Post()
  create(@Body() dto: CreateCatalogYearHttpDto) {
    return this.catalog_years_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogYearHttpDto,
  ) {
    return this.catalog_years_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllYearsHttpDto) {
    return this.catalog_years_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_years_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_years_service.remove(id);
  }
}
