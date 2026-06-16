import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { ProvincesUseCase } from "../../../../application/provinces-use-cases/provinces.use-case";
import { V1_PROVINCES } from "@/src/contexts/locations/infrastructure/http-api/route.constants";
import { UpdateProvinceHttpDto } from "./dto/update-province.http-dto";

@Controller(V1_PROVINCES)
export class ProvincesController {
  constructor(private readonly provinces_use_case: ProvincesUseCase) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.provinces_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.provinces_use_case.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_province_http_dto: UpdateProvinceHttpDto,
  ) {
    return this.provinces_use_case.update(id, {
      name: update_province_http_dto.name,
      image_url: update_province_http_dto.image_url,
    });
  }
}
