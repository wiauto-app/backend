import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { ReferralsService } from "../../services/referrals.service";
import { V1_REFERRALS } from "../route.constants";

@Controller(V1_REFERRALS)
export class GetReferralMeController {
  constructor(private readonly referrals_service: ReferralsService) {}

  @Get("me")
  @UseGuards(JwtGuard)
  run(@GetUserId() profile_id: string) {
    return this.referrals_service.getReferralMe(profile_id);
  }
}
