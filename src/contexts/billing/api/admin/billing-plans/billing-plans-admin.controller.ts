import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { BillingPlansService } from "../../../services/billing-plans.service";
import { V1_BILLING_PLANS } from "../../route.constants";

import { CreateSubscriptionPlanHttpDto } from "./create-subscription-plan.http-dto";
import { UpdateSubscriptionPlanHttpDto } from "./update-subscription-plan.http-dto";

@AuthPermissions(PermissionKeys.BILLING_MANAGE)
@Controller(V1_BILLING_PLANS)
export class BillingPlansAdminController {
  constructor(private readonly billing_plans_service: BillingPlansService) {}

  @Post()
  create(@Body() body: CreateSubscriptionPlanHttpDto) {
    return this.billing_plans_service.create(body);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto & { search?: string }) {
    return this.billing_plans_service.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    
    return this.billing_plans_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateSubscriptionPlanHttpDto,
  ) {
    return this.billing_plans_service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.billing_plans_service.remove(id);
  }

  @Post(":id/sync-stripe")
  syncStripe(@Param("id", ParseUUIDPipe) id: string) {
    return this.billing_plans_service.syncStripe(id);
  }
}
