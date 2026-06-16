import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { CommunitiesUseCase } from "../../../../application/communities-use-cases/communities.use-case";
import { V1_COMMUNITIES } from "@/src/contexts/locations/infrastructure/http-api/route.constants";
import { UpdateCommunityHttpDto } from "./dto/update-community.http-dto";

@Controller(V1_COMMUNITIES)
export class CommunitiesController {
  constructor(private readonly communities_use_case: CommunitiesUseCase) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.communities_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.communities_use_case.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_community_http_dto: UpdateCommunityHttpDto,
  ) {
    return this.communities_use_case.update(id, {
      name: update_community_http_dto.name,
      image_url: update_community_http_dto.image_url,
    });
  }
}
