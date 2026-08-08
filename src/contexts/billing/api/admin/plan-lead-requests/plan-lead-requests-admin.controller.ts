import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { PlanLeadRequestsService } from "../../../services/plan-lead-requests.service";
import { V1_ADMIN_PLAN_LEAD_REQUESTS } from "../../route.constants";
import {
  CreatePlanLeadProposalHttpDto,
  UpdatePlanLeadRequestHttpDto,
} from "./update-plan-lead-request.http-dto";

@AuthAdmin()
@Controller(V1_ADMIN_PLAN_LEAD_REQUESTS)
export class PlanLeadRequestsAdminController {
  constructor(private readonly plan_lead_requests_service: PlanLeadRequestsService) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.plan_lead_requests_service.findAll({
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.plan_lead_requests_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdatePlanLeadRequestHttpDto,
  ) {
    return this.plan_lead_requests_service.update(id, body);
  }

  @Post(":id/proposal")
  createProposal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CreatePlanLeadProposalHttpDto,
  ) {
    return this.plan_lead_requests_service.createProposal(id, body);
  }
}
