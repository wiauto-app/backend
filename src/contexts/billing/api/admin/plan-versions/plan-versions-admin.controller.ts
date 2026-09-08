import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";

import { PlanVersionsService } from "../../../services/plan-versions.service";
import {
  V1_BILLING_FEATURE_CATALOG,
  V1_BILLING_PLANS,
} from "../../route.constants";
import { ReplacePlanEntitlementsHttpDto } from "./replace-plan-entitlements.http-dto";

@AuthAdmin()
@Controller()
export class PlanVersionsAdminController {
  constructor(private readonly plan_versions_service: PlanVersionsService) {}

  @Get(V1_BILLING_FEATURE_CATALOG)
  getFeatureCatalog() {
    return this.plan_versions_service.getFeatureCatalog();
  }

  @Get(`${V1_BILLING_PLANS}/:planId/versions`)
  listVersions(@Param("planId", ParseUUIDPipe) plan_id: string) {
    return this.plan_versions_service.listByPlanId(plan_id);
  }

  @Get(`${V1_BILLING_PLANS}/:planId/entitlements`)
  async getEntitlements(@Param("planId", ParseUUIDPipe) plan_id: string) {
    await this.plan_versions_service.assertPlanExists(plan_id);
    return this.plan_versions_service.getCurrentVersion(plan_id);
  }

  @Put(`${V1_BILLING_PLANS}/:planId/entitlements`)
  replaceEntitlements(
    @Param("planId", ParseUUIDPipe) plan_id: string,
    @Body() body: ReplacePlanEntitlementsHttpDto,
  ) {
    return this.plan_versions_service.replaceEntitlements(
      plan_id,
      body.entitlements as unknown as Parameters<
        PlanVersionsService["replaceEntitlements"]
      >[1],
    );
  }
}
