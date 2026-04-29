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
import { V1_CATALOG_BODY_TYPES } from "../../../../route.constants";
import { CatalogBodyTypesUseCase } from "../../../application/catalog-body-types-use-cases/catalog-body-types.use-case";
import { CreateCatalogBodyTypeHttpDto } from "./dto/create-catalog-body-type.http-dto";
import { UpdateCatalogBodyTypeHttpDto } from "./update-catalog-body-type.http-dto";

@Controller(V1_CATALOG_BODY_TYPES)
export class CatalogBodyTypesController {
  constructor(private readonly use_case: CatalogBodyTypesUseCase) {}

  @Post()
  create(@Body() dto: CreateCatalogBodyTypeHttpDto) {
    return this.use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogBodyTypeHttpDto,
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
