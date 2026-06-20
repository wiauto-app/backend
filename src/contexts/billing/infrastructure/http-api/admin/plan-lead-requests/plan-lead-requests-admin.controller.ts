import { Controller, Get, Query } from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { PlanLeadRequestsService } from "../../../../application/services/plan-lead-requests.service";
import { V1_ADMIN_PLAN_LEAD_REQUESTS } from "../../../route.constants";

@AuthPermissions(PermissionKeys.BILLING_MANAGE)
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
}
