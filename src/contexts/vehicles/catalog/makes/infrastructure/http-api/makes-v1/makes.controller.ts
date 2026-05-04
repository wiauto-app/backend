import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { V1_CATALOG_MAKES } from "../../../../route.constants";
import { MakesUseCase } from "../../../application/makes-use-cases/makes.use-case";
import { CreateMakeHttpDto } from "./dto/create-make.http-dto";
import { UpdateMakeHttpDto } from "./update-make.http-dto";

@Controller(V1_CATALOG_MAKES)
export class MakesController {
  constructor(private readonly makes_use_case: MakesUseCase) {}

  @Post()
  create(@Body() dto: CreateMakeHttpDto) {
    return this.makes_use_case.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMakeHttpDto,
  ) {
    return this.makes_use_case.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.makes_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.makes_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.makes_use_case.remove(id);
  }
}
