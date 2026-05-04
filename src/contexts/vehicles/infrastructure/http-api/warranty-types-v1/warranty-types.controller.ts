import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
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
import { V1_WARRANTY_TYPES } from "../route.constants";
import { WarrantyTypesUseCase } from "../../../application/warranty-types-use-cases/warranty-types.use-case";
import { CreateWarrantyTypeHttpDto } from "./dto/create-warranty-type.http-dto";
import { UpdateWarrantyTypeHttpDto } from "./update-warranty-type.http-dto";

@Controller(V1_WARRANTY_TYPES)
export class WarrantyTypesController {
  constructor(
    private readonly warranty_types_use_case: WarrantyTypesUseCase,
  ) {}

  @Post()
  create(@Body() create_warranty_type_http_dto: CreateWarrantyTypeHttpDto) {
    return this.warranty_types_use_case.create(create_warranty_type_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_warranty_type_http_dto: UpdateWarrantyTypeHttpDto,
  ) {
    return this.warranty_types_use_case.update(id, update_warranty_type_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.warranty_types_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.warranty_types_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.warranty_types_use_case.remove(id);
  }
}
