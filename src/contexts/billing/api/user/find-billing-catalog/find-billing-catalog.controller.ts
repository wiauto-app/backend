import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingPlansService } from "../../../services/billing-plans.service";
import { V1_BILLING_PLANS_CATALOG } from "../../route.constants";

import { FindBillingCatalogQueryHttpDto } from "./find-billing-catalog.query.http-dto";

@Controller(V1_BILLING_PLANS_CATALOG)
@UseGuards(JwtGuard)
export class FindBillingCatalogController {
  constructor(private readonly billing_plans_service: BillingPlansService) {}

  @Get()
  run(@Query() query: FindBillingCatalogQueryHttpDto) {
    return this.billing_plans_service.findCatalog(query.audience);
  }
}
