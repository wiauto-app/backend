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
import { V1_CATALOG_VERSIONS } from "../../../../route.constants";
import { CatalogVersionsUseCase } from "../../../application/catalog-versions-use-cases/catalog-versions.use-case";
import { CreateCatalogVersionHttpDto } from "./dto/create-catalog-version.http-dto";
import { UpdateCatalogVersionHttpDto } from "./update-catalog-version.http-dto";
import { FindAllVersionsHttpDto } from "./dto/find-all-versions.http-dto";

@Controller(V1_CATALOG_VERSIONS)
export class CatalogVersionsController {
  constructor(private readonly use_case: CatalogVersionsUseCase) {}

  @Post()
  create(@Body() dto: CreateCatalogVersionHttpDto) {
    return this.use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogVersionHttpDto,
  ) {
    return this.use_case.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllVersionsHttpDto) {
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
