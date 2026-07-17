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

import { WarrantyTypesService } from "../../services/warranty-types.service";
import { V1_WARRANTY_TYPES } from "../route.constants";
import { CreateWarrantyTypeHttpDto } from "./dto/create-warranty-type.http-dto";
import { UpdateWarrantyTypeHttpDto } from "./update-warranty-type.http-dto";

@Controller(V1_WARRANTY_TYPES)
export class WarrantyTypesController {
  constructor(private readonly warranty_types_service: WarrantyTypesService) {}

  @Post()
  create(@Body() create_warranty_type_http_dto: CreateWarrantyTypeHttpDto) {
    return this.warranty_types_service.create(create_warranty_type_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_warranty_type_http_dto: UpdateWarrantyTypeHttpDto,
  ) {
    return this.warranty_types_service.update(
      id,
      update_warranty_type_http_dto,
    );
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.warranty_types_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.warranty_types_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.warranty_types_service.remove(id);
  }
}
