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
import { V1_CATALOG_BODY_TYPES } from "../../../route.constants";
import { CatalogBodyTypesService } from "../../services/catalog-body-types.service";
import { CreateCatalogBodyTypeHttpDto } from "./dto/create-catalog-body-type.http-dto";
import { UpdateCatalogBodyTypeHttpDto } from "./update-catalog-body-type.http-dto";
import { FindAllBodyTypesHttpDto } from "./dto/find-all-body-types.http-dto";

@Controller(V1_CATALOG_BODY_TYPES)
export class CatalogBodyTypesController {
  constructor(private readonly catalog_body_types_service: CatalogBodyTypesService) {}

  @Post()
  create(@Body() dto: CreateCatalogBodyTypeHttpDto) {
    return this.catalog_body_types_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogBodyTypeHttpDto,
  ) {
    return this.catalog_body_types_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllBodyTypesHttpDto) {
    return this.catalog_body_types_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_body_types_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_body_types_service.remove(id);
  }
}
