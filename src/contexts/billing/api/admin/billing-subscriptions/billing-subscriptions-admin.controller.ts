import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";
import { SubscriptionOverridesService } from "../../../services/subscription-overrides.service";
import { V1_BILLING_SUBSCRIPTIONS } from "../../route.constants";
import { ReplaceSubscriptionOverridesHttpDto } from "./replace-subscription-overrides.http-dto";

@AuthAdmin()
@Controller(V1_BILLING_SUBSCRIPTIONS)
export class BillingSubscriptionsAdminController {
  constructor(
    private readonly subscription_repository: TypeOrmSubscriptionRepository,
    private readonly overrides_service: SubscriptionOverridesService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.subscription_repository.findAllAdmin({
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(":id/overrides")
  listOverrides(@Param("id", ParseUUIDPipe) id: string) {
    return this.overrides_service.list(id);
  }

  @Put(":id/overrides")
  replaceOverrides(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReplaceSubscriptionOverridesHttpDto,
  ) {
    return this.overrides_service.replace(
      id,
      body.overrides as unknown as Parameters<
        SubscriptionOverridesService["replace"]
      >[1],
    );
  }
}
