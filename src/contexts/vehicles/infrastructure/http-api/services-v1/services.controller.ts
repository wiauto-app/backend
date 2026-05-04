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
import { V1_SERVICES } from "../route.constants";
import { ServicesUseCase } from "../../../application/services-use-cases/services.use-case";
import { CreateServiceHttpDto } from "./dto/create-service.http-dto";
import { UpdateServiceHttpDto } from "./update-service.http-dto";

@Controller(V1_SERVICES)
export class ServicesController {
  constructor(private readonly services_use_case: ServicesUseCase) {}

  @Post()
  create(@Body() create_service_http_dto: CreateServiceHttpDto) {
    return this.services_use_case.create(create_service_http_dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() update_service_http_dto: UpdateServiceHttpDto,
  ) {
    return this.services_use_case.update(id, update_service_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.services_use_case.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.services_use_case.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.services_use_case.remove(id);
  }
}
