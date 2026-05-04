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

import { CuotasUseCase } from "../../../application/cuotas-use-cases/cuotas.use-case";
import { V1_CUOTAS } from "../route.constants";
import { CreateCuotaHttpDto } from "./dto/create-cuota.http-dto";
import { UpdateCuotaHttpDto } from "./update-cuota.http-dto";

@Controller(V1_CUOTAS)
export class CuotasController {
  constructor(private readonly cuotas_use_case: CuotasUseCase) {}

  @Post()
  create(@Body() dto: CreateCuotaHttpDto) {
    return this.cuotas_use_case.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCuotaHttpDto) {
    return this.cuotas_use_case.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.cuotas_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.cuotas_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.cuotas_use_case.remove(id);
  }
}
