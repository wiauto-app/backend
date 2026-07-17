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

import { ColorsService } from "../../services/colors.service";
import { V1_COLORS } from "../route.constants";
import { CreateColorHttpDto } from "./dto/create-color.http-dto";
import { UpdateColorHttpDto } from "./update-color.http-dto";

@Controller(V1_COLORS)
export class ColorsController {
  constructor(private readonly colors_service: ColorsService) {}

  @Post()
  create(@Body() create_color_http_dto: CreateColorHttpDto) {
    return this.colors_service.create(create_color_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_color_http_dto: UpdateColorHttpDto,
  ) {
    return this.colors_service.update(id, {
      name: update_color_http_dto.name,
      hex_code: update_color_http_dto.hex_code,
    });
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.colors_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.colors_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.colors_service.remove(id);
  }
}
