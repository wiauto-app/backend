import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { FeaturesService } from "../../services/features.service";
import { V1_FEATURES } from "../route.constants";
import { CreateFeatureHttpDto } from "./create-feature/create-feature.http-dto";
import { UpdateFeatureHttpDto } from "./update-feature/update-feature.dto";

@Controller(V1_FEATURES)
export class FeaturesController {
  constructor(private readonly features_service: FeaturesService) {}

  @Post()
  create(@Body() create_feature_http_dto: CreateFeatureHttpDto) {
    return this.features_service.create(create_feature_http_dto);
  }

  @Patch()
  update(@Body() update_feature_http_dto: UpdateFeatureHttpDto) {
    return this.features_service.update(update_feature_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.features_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.features_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.features_service.remove(id);
  }
}
