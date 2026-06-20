import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";

import { BillingCheckoutService } from "../../../../application/services/billing-plans.service";
import { V1_PUBLIC_BILLING_CHECKOUT_SUBSCRIPTION } from "../../../route.constants";

import { CreatePublicSubscriptionCheckoutHttpDto } from "./create-public-subscription-checkout.http-dto";

@Controller(V1_PUBLIC_BILLING_CHECKOUT_SUBSCRIPTION)
export class CreatePublicSubscriptionCheckoutController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  run(
    @GetOptionalUserId() profile_id: string | undefined,
    @Body() body: CreatePublicSubscriptionCheckoutHttpDto,
  ) {
    return this.checkout_service.createPublicSubscriptionCheckout(
      profile_id,
      body.plan_price_id,
    );
  }
}
