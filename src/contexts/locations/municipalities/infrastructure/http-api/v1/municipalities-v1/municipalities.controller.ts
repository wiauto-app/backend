import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { MunicipalitiesUseCase } from "@/src/contexts/locations/municipalities/application/municipalities-use-cases/municipalities.use-case";
import { V1_MUNICIPALITIES } from "@/src/contexts/locations/infrastructure/http-api/route.constants";
import { UpdateMunicipalityHttpDto } from "./dto/update-municipality.http-dto";

@Controller(V1_MUNICIPALITIES)
export class MunicipalitiesController {
  constructor(
    private readonly municipalities_use_case: MunicipalitiesUseCase,
  ) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.municipalities_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.municipalities_use_case.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_municipality_http_dto: UpdateMunicipalityHttpDto,
  ) {
    return this.municipalities_use_case.update(id, {
      name: update_municipality_http_dto.name,
      image_url: update_municipality_http_dto.image_url,
    });
  }
}
