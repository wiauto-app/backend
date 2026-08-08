import { Controller, Get, Query } from "@nestjs/common";

import { BillingPlansService } from "../../../services/billing-plans.service";
import { BILLING_TYPE } from "../../../types/billing.enums";
import { V1_PUBLIC_BILLING_PLANS_CATALOG } from "../../route.constants";

import { FindPublicPlansCatalogQueryHttpDto } from "./find-public-plans-catalog.query.http-dto";

@Controller(V1_PUBLIC_BILLING_PLANS_CATALOG)
export class FindPublicPlansCatalogController {
  constructor(private readonly billing_plans_service: BillingPlansService) {}

  @Get()
  run(@Query() query: FindPublicPlansCatalogQueryHttpDto) {
    return this.billing_plans_service.findCatalog(
      query.billing_type ?? BILLING_TYPE.RECURRING,
    );
  }
}
