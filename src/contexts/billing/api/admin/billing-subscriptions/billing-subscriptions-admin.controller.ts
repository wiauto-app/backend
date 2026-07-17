import { Controller, Get, Query } from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { V1_BILLING_SUBSCRIPTIONS } from "../../route.constants";

@AuthPermissions(PermissionKeys.BILLING_MANAGE)
@Controller(V1_BILLING_SUBSCRIPTIONS)
export class BillingSubscriptionsAdminController {
  constructor(private readonly subscription_repository: TypeOrmSubscriptionRepository) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.subscription_repository.findAllAdmin({
      page: query.page,
      limit: query.limit,
    });
  }
}
