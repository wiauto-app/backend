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

import { DgtLabelsService } from "../../services/dgt-labels.service";
import { V1_DGT_LABELS } from "../route.constants";
import { CreateDgtLabelHttpDto } from "./dto/create-dgt-label.http-dto";
import { UpdateDgtLabelHttpDto } from "./update-dgt-label.http-dto";

@Controller(V1_DGT_LABELS)
export class DgtLabelsController {
  constructor(private readonly dgt_labels_service: DgtLabelsService) {}

  @Post()
  create(@Body() create_dgt_label_http_dto: CreateDgtLabelHttpDto) {
    return this.dgt_labels_service.create(create_dgt_label_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_dgt_label_http_dto: UpdateDgtLabelHttpDto,
  ) {
    return this.dgt_labels_service.update(id, update_dgt_label_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.dgt_labels_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.dgt_labels_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.dgt_labels_service.remove(id);
  }
}
