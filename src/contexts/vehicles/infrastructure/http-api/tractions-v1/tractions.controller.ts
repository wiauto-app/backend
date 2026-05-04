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
import { V1_TRACTIONS } from "../route.constants";
import { TractionsUseCase } from "../../../application/tractions-use-cases/tractions.use-case";
import { CreateTractionHttpDto } from "./dto/create-traction.http-dto";
import { UpdateTractionHttpDto } from "./update-traction.http-dto";

@Controller(V1_TRACTIONS)
export class TractionsController {
  constructor(private readonly tractions_use_case: TractionsUseCase) {}

  @Post()
  create(@Body() create_traction_http_dto: CreateTractionHttpDto) {
    return this.tractions_use_case.create(create_traction_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_traction_http_dto: UpdateTractionHttpDto,
  ) {
    return this.tractions_use_case.update(id, update_traction_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.tractions_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tractions_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tractions_use_case.remove(id);
  }
}
