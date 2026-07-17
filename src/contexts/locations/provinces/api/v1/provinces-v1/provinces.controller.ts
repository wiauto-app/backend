import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { ProvincesService } from "../../../services/provinces.service";
import { V1_PROVINCES } from "@/src/contexts/locations/api/route.constants";
import { UpdateProvinceHttpDto } from "./dto/update-province.http-dto";

@Controller(V1_PROVINCES)
export class ProvincesController {
  constructor(private readonly provinces_service: ProvincesService) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.provinces_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.provinces_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_province_http_dto: UpdateProvinceHttpDto,
  ) {
    return this.provinces_service.update(id, {
      name: update_province_http_dto.name,
      image_url: update_province_http_dto.image_url,
    });
  }
}
