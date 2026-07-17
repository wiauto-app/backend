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

import { ServicesService } from "../../services/services.service";
import { V1_SERVICES } from "../route.constants";
import { CreateServiceHttpDto } from "./dto/create-service.http-dto";
import { UpdateServiceHttpDto } from "./update-service.http-dto";

@Controller(V1_SERVICES)
export class ServicesController {
  constructor(private readonly services_service: ServicesService) {}

  @Post()
  create(@Body() create_service_http_dto: CreateServiceHttpDto) {
    return this.services_service.create(create_service_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_service_http_dto: UpdateServiceHttpDto,
  ) {
    return this.services_service.update(id, update_service_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.services_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.services_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.services_service.remove(id);
  }
}
