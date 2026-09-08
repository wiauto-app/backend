import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { PlanContactLeadsService } from "../../../services/plan-contact-leads.service";
import { V1_ADMIN_PLAN_CONTACT_LEADS } from "../../route.constants";
import { UpdatePlanContactLeadHttpDto } from "./update-plan-contact-lead.http-dto";

@AuthAdmin()
@Controller(V1_ADMIN_PLAN_CONTACT_LEADS)
export class PlanContactLeadsAdminController {
  constructor(
    private readonly plan_contact_leads_service: PlanContactLeadsService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.plan_contact_leads_service.findAll({
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.plan_contact_leads_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdatePlanContactLeadHttpDto,
  ) {
    return this.plan_contact_leads_service.update(id, body);
  }
}
