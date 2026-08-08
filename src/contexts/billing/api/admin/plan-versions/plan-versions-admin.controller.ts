import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

import { PlanVersionsService } from "../../../services/plan-versions.service";
import {
  V1_BILLING_FEATURE_CATALOG,
  V1_BILLING_PLANS,
} from "../../route.constants";
import { ReplacePlanEntitlementsHttpDto } from "./replace-plan-entitlements.http-dto";

@AuthPermissions(PermissionKeys.BILLING_MANAGE)
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

  @Post(`${V1_BILLING_PLANS}/:planId/versions/draft`)
  ensureDraft(@Param("planId", ParseUUIDPipe) plan_id: string) {
    return this.plan_versions_service.ensureDraftVersion(plan_id);
  }

  @Put(`${V1_BILLING_PLANS}/:planId/versions/draft/entitlements`)
  replaceDraftEntitlements(
    @Param("planId", ParseUUIDPipe) plan_id: string,
    @Body() body: ReplacePlanEntitlementsHttpDto,
  ) {
    return this.plan_versions_service.replaceDraftEntitlements(
      plan_id,
      body.entitlements as unknown as Parameters<
        PlanVersionsService["replaceDraftEntitlements"]
      >[1],
    );
  }

  @Post(`${V1_BILLING_PLANS}/:planId/versions/:versionId/publish`)
  publishVersion(
    @Param("planId", ParseUUIDPipe) plan_id: string,
    @Param("versionId", ParseUUIDPipe) version_id: string,
  ) {
    return this.plan_versions_service.publish(plan_id, version_id);
  }

  @Post(`${V1_BILLING_PLANS}/:planId/publish`)
  publishLatestDraft(@Param("planId", ParseUUIDPipe) plan_id: string) {
    return this.plan_versions_service.publish(plan_id);
  }
}
