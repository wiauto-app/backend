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
import { V1_CATALOG_VERSIONS } from "../../../route.constants";
import { CatalogVersionsService } from "../../services/catalog-versions.service";
import { CreateCatalogVersionHttpDto } from "./dto/create-catalog-version.http-dto";
import { UpdateCatalogVersionHttpDto } from "./update-catalog-version.http-dto";
import { FindAllVersionsHttpDto } from "./dto/find-all-versions.http-dto";

@Controller(V1_CATALOG_VERSIONS)
export class CatalogVersionsController {
  constructor(private readonly catalog_versions_service: CatalogVersionsService) {}

  @Post()
  create(@Body() dto: CreateCatalogVersionHttpDto) {
    return this.catalog_versions_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogVersionHttpDto,
  ) {
    return this.catalog_versions_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllVersionsHttpDto) {
    return this.catalog_versions_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_versions_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_versions_service.remove(id);
  }
}
