import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
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
import { V1_CATALOG_MAKES } from "../../../route.constants";
import { MakesService } from "../../services/makes.service";
import { CreateMakeHttpDto } from "./dto/create-make.http-dto";
import { FindSearchMakesHttpDto } from "./dto/find-search-makes.http-dto";
import { UpdateMakeHttpDto } from "./update-make.http-dto";

@Controller(V1_CATALOG_MAKES)
export class MakesController {
  constructor(private readonly makes_service: MakesService) {}

  @Post()
  create(@Body() dto: CreateMakeHttpDto) {
    return this.makes_service.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMakeHttpDto,
  ) {
    return this.makes_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.makes_service.findAll(query);
  }

  @Get("search")
  findSearchMakes(@Query() query: FindSearchMakesHttpDto) {
    return this.makes_service.findSearchMakes(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.makes_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.makes_service.remove(id);
  }
}
