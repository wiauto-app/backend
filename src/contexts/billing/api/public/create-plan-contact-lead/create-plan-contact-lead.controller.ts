import { Body, Controller, Post } from "@nestjs/common";

import { PlanContactLeadsService } from "../../../services/plan-contact-leads.service";
import { V1_PUBLIC_BILLING_PLAN_CONTACT_LEADS } from "../../route.constants";

import { CreatePlanContactLeadHttpDto } from "./create-plan-contact-lead.http-dto";

@Controller(V1_PUBLIC_BILLING_PLAN_CONTACT_LEADS)
export class CreatePlanContactLeadController {
  constructor(
    private readonly plan_contact_leads_service: PlanContactLeadsService,
  ) {}

  @Post()
  create(@Body() body: CreatePlanContactLeadHttpDto) {
    return this.plan_contact_leads_service.create(body);
  }
}
