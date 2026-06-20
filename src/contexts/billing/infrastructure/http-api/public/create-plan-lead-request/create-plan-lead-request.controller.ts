import { Body, Controller, Post } from "@nestjs/common";

import { PlanLeadRequestsService } from "../../../../application/services/plan-lead-requests.service";
import { V1_PUBLIC_BILLING_PLAN_LEAD_REQUESTS } from "../../../route.constants";

import { CreatePlanLeadRequestHttpDto } from "./create-plan-lead-request.http-dto";

@Controller(V1_PUBLIC_BILLING_PLAN_LEAD_REQUESTS)
export class CreatePlanLeadRequestController {
  constructor(private readonly plan_lead_requests_service: PlanLeadRequestsService) {}

  @Post()
  create(@Body() body: CreatePlanLeadRequestHttpDto) {
    return this.plan_lead_requests_service.create(body);
  }
}
