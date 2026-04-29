import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { V1_COLORS } from "../route.constants";
import { ColorsUseCase } from "../../../application/colors-use-cases/colors.use-case";
import { CreateColorHttpDto } from "./dto/create-color.http-dto";
import { UpdateColorHttpDto } from "./update-color.http-dto";

@Controller(V1_COLORS)
export class ColorsController {
  constructor(private readonly colors_use_case: ColorsUseCase) {}

  @Post()
  create(@Body() create_color_http_dto: CreateColorHttpDto) {
    return this.colors_use_case.create(create_color_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_color_http_dto: UpdateColorHttpDto,
  ) {
    return this.colors_use_case.update(id, {
      name: update_color_http_dto.name,
      hex_code: update_color_http_dto.hex_code,
    });
  }

  @Get()
  findAll() {
    return this.colors_use_case.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.colors_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.colors_use_case.remove(id);
  }
}
