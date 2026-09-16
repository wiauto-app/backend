import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";

import { GenericLeadsService } from "../../../services/leads.service";
import { V1_ADMIN_LEADS } from "../../route.constants";
import { FindGenericLeadsHttpDto } from "./find-leads.http-dto";
import { UpdateGenericLeadHttpDto } from "./update-lead.http-dto";

@AuthAdmin()
@Controller(V1_ADMIN_LEADS)
export class GenericLeadsAdminController {
  constructor(private readonly leads_service: GenericLeadsService) {}

  @Get()
  findAll(@Query() query: FindGenericLeadsHttpDto) {
    return this.leads_service.findAll({
      page: query.page,
      limit: query.limit,
      type: query.type,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.leads_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateGenericLeadHttpDto,
  ) {
    return this.leads_service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.leads_service.remove(id);
  }
}
