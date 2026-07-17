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

import { CuotasService } from "../../services/cuotas.service";
import { V1_CUOTAS } from "../route.constants";
import { CreateCuotaHttpDto } from "./dto/create-cuota.http-dto";
import { UpdateCuotaHttpDto } from "./update-cuota.http-dto";

@Controller(V1_CUOTAS)
export class CuotasController {
  constructor(private readonly cuotas_service: CuotasService) {}

  @Post()
  create(@Body() dto: CreateCuotaHttpDto) {
    return this.cuotas_service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCuotaHttpDto) {
    return this.cuotas_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.cuotas_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.cuotas_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.cuotas_service.remove(id);
  }
}
