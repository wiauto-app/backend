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
import { V1_CATALOG_MODELS } from "../../../route.constants";
import { CatalogModelsService } from "../../services/catalog-models.service";
import { CreateCatalogModelHttpDto } from "./dto/create-catalog-model.http-dto";
import { UpdateCatalogModelHttpDto } from "./update-catalog-model.http-dto";
import { FindAllModelsHttpDto } from "./dto/find-all-models.http-dto";
import { FindSearchModelsHttpDto } from "./dto/find-search-models.http-dto";

@Controller(V1_CATALOG_MODELS)
export class CatalogModelsController {
  constructor(private readonly catalog_models_service: CatalogModelsService) {}

  @Post()
  create(@Body() dto: CreateCatalogModelHttpDto) {
    return this.catalog_models_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogModelHttpDto,
  ) {
    return this.catalog_models_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: FindAllModelsHttpDto) {
    return this.catalog_models_service.findAll(query);
  }

  @Get("search")
  findSearchModels(@Query() query: FindSearchModelsHttpDto) {
    return this.catalog_models_service.findSearchModels(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_models_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalog_models_service.remove(id);
  }
}
