import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { CommunitiesService } from "../../../services/communities.service";
import { V1_COMMUNITIES } from "@/src/contexts/locations/api/route.constants";
import { UpdateCommunityHttpDto } from "./dto/update-community.http-dto";

@Controller(V1_COMMUNITIES)
export class CommunitiesController {
  constructor(private readonly communities_service: CommunitiesService) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.communities_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.communities_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_community_http_dto: UpdateCommunityHttpDto,
  ) {
    return this.communities_service.update(id, {
      name: update_community_http_dto.name,
      image_url: update_community_http_dto.image_url,
    });
  }
}
