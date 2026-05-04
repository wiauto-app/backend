import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
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
import { V1_CATALOG_YEARS } from "../../../../route.constants";
import { CatalogYearsUseCase } from "../../../application/catalog-years-use-cases/catalog-years.use-case";
import { CreateCatalogYearHttpDto } from "./dto/create-catalog-year.http-dto";
import { UpdateCatalogYearHttpDto } from "./update-catalog-year.http-dto";

@Controller(V1_CATALOG_YEARS)
export class CatalogYearsController {
  constructor(private readonly use_case: CatalogYearsUseCase) {}

  @Post()
  create(@Body() dto: CreateCatalogYearHttpDto) {
    return this.use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogYearHttpDto,
  ) {
    return this.use_case.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.use_case.findAll(query);
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
