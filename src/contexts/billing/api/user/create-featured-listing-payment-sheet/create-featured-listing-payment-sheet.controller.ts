import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingCheckoutService } from "../../../services/billing-plans.service";
import { V1_BILLING_FEATURED_LISTING_PAYMENT_SHEET } from "../../route.constants";

import { CreateFeaturedListingPaymentSheetHttpDto } from "./create-featured-listing-payment-sheet.http-dto";

@Controller(V1_BILLING_FEATURED_LISTING_PAYMENT_SHEET)
@UseGuards(JwtGuard)
export class CreateFeaturedListingPaymentSheetController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateFeaturedListingPaymentSheetHttpDto,
  ) {
    return this.checkout_service.createFeaturedListingPaymentSheet(
      profile_id,
      body,
    );
  }
}
