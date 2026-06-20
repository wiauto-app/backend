import { Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { BillingCheckoutService } from "../../../../application/services/billing-plans.service";
import { V1_BILLING_PORTAL } from "../../../route.constants";

@Controller(V1_BILLING_PORTAL)
@UseGuards(JwtGuard)
export class CreateBillingPortalController {
  constructor(private readonly checkout_service: BillingCheckoutService) {}

  @Post()
  run(@GetUserId() profile_id: string) {
    return this.checkout_service.createPortalSession(profile_id);
  }
}
