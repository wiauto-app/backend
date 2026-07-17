import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { MunicipalitiesService } from "@/src/contexts/locations/municipalities/services/municipalities.service";
import { V1_MUNICIPALITIES } from "@/src/contexts/locations/api/route.constants";
import { UpdateMunicipalityHttpDto } from "./dto/update-municipality.http-dto";

@Controller(V1_MUNICIPALITIES)
export class MunicipalitiesController {
  constructor(
    private readonly municipalities_service: MunicipalitiesService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.municipalities_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.municipalities_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_municipality_http_dto: UpdateMunicipalityHttpDto,
  ) {
    return this.municipalities_service.update(id, {
      name: update_municipality_http_dto.name,
      image_url: update_municipality_http_dto.image_url,
    });
  }
}
