import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingCheckoutService } from "../../../services/billing-plans.service";
import { V1_BILLING_CHECKOUT_SUBSCRIPTION } from "../../route.constants";

import { CreateSubscriptionCheckoutHttpDto } from "./create-subscription-checkout.http-dto";

@Controller(V1_BILLING_CHECKOUT_SUBSCRIPTION)
@UseGuards(JwtGuard)
export class CreateSubscriptionCheckoutController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateSubscriptionCheckoutHttpDto,
  ) {
    return this.checkout_service.createSubscriptionCheckout(
      profile_id,
      body.plan_price_id,
    );
  }
}
