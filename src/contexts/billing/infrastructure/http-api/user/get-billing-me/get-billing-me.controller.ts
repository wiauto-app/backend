import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { EntitlementsService } from "../../../../application/services/entitlements.service";
import { V1_BILLING_ME } from "../../../route.constants";

@Controller(V1_BILLING_ME)
@UseGuards(JwtGuard)
export class GetBillingMeController {
  constructor(private readonly entitlements_service: EntitlementsService) {}

  @Get()
  run(@GetUserId() profile_id: string) {
    return this.entitlements_service.getBillingMe(profile_id);
  }
}
