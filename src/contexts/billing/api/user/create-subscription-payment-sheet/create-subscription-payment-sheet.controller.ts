import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingCheckoutService } from "../../../services/billing-plans.service";
import { V1_BILLING_SUBSCRIPTIONS_PAYMENT_SHEET } from "../../route.constants";

import { CreateSubscriptionPaymentSheetHttpDto } from "./create-subscription-payment-sheet.http-dto";

@Controller(V1_BILLING_SUBSCRIPTIONS_PAYMENT_SHEET)
@UseGuards(JwtGuard)
export class CreateSubscriptionPaymentSheetController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateSubscriptionPaymentSheetHttpDto,
  ) {
    return this.checkout_service.createSubscriptionPaymentSheet(
      profile_id,
      body,
    );
  }
}
