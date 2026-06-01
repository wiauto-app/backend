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
import { V1_CATALOG_MODELS } from "../../../../route.constants";
import { CatalogModelsUseCase } from "../../../application/catalog-models-use-cases/catalog-models.use-case";
import { CreateCatalogModelHttpDto } from "./dto/create-catalog-model.http-dto";
import { UpdateCatalogModelHttpDto } from "./update-catalog-model.http-dto";
import { FindAllModelsHttpDto } from "./dto/find-all-models.http-dto";
import { FindSearchModelsHttpDto } from "./dto/find-search-models.http-dto";

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
  
  findAll(@Query() query: FindAllModelsHttpDto) {
    return this.use_case.findAll(query);
  }

  @Get("search")
  findSearchModels(@Query() query: FindSearchModelsHttpDto) {
    return this.use_case.findSearchModels(query);
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
