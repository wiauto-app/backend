import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingCheckoutService } from "../../../../application/services/billing-plans.service";
import { V1_BILLING_CHECKOUT_ONE_TIME } from "../../../route.constants";

import { CreateOneTimeCheckoutHttpDto } from "./create-one-time-checkout.http-dto";

@Controller(V1_BILLING_CHECKOUT_ONE_TIME)
@UseGuards(JwtGuard)
export class CreateOneTimeCheckoutController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateOneTimeCheckoutHttpDto,
  ) {
    return this.checkout_service.createOneTimeCheckout(
      profile_id,
      body.plan_price_id,
      body.metadata,
      {
        success_url: body.success_url,
        cancel_url: body.cancel_url,
      },
    );
  }
}
