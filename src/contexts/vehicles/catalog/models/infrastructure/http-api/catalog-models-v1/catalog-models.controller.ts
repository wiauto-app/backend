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
import { V1_CATALOG_MODELS } from "../../../../route.constants";
import { CatalogModelsUseCase } from "../../../application/catalog-models-use-cases/catalog-models.use-case";
import { CreateCatalogModelHttpDto } from "./dto/create-catalog-model.http-dto";
import { UpdateCatalogModelHttpDto } from "./update-catalog-model.http-dto";

@Controller(V1_CATALOG_MODELS)
export class CatalogModelsController {
  constructor(private readonly use_case: CatalogModelsUseCase) {}

  @Post()
  create(@Body() dto: CreateCatalogModelHttpDto) {
    return this.use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogModelHttpDto,
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
