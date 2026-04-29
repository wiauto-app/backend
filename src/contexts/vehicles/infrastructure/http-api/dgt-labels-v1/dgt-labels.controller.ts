import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { V1_DGT_LABELS } from "../route.constants";
import { DgtLabelsUseCase } from "../../../application/dgt-labels-use-cases/dgt-labels.use-case";
import { CreateDgtLabelHttpDto } from "./dto/create-dgt-label.http-dto";
import { UpdateDgtLabelHttpDto } from "./update-dgt-label.http-dto";

@Controller(V1_DGT_LABELS)
export class DgtLabelsController {
  constructor(private readonly dgt_labels_use_case: DgtLabelsUseCase) {}

  @Post()
  create(@Body() create_dgt_label_http_dto: CreateDgtLabelHttpDto) {
    return this.dgt_labels_use_case.create(create_dgt_label_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_dgt_label_http_dto: UpdateDgtLabelHttpDto,
  ) {
    return this.dgt_labels_use_case.update(id, update_dgt_label_http_dto);
  }

  @Get()
  findAll() {
    return this.dgt_labels_use_case.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.dgt_labels_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.dgt_labels_use_case.remove(id);
  }
}
