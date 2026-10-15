import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { ReferralsService } from "../../services/referrals.service";
import { V1_REFERRALS } from "../route.constants";
import { AttributeReferralHttpDto } from "./attribute-referral.http-dto";

@Controller(V1_REFERRALS)
export class AttributeReferralController {
  constructor(private readonly referrals_service: ReferralsService) {}

  @Post("attribute")
  @UseGuards(JwtGuard)
  async run(
    @GetUserId() profile_id: string,
    @Body() body: AttributeReferralHttpDto,
  ) {
    await this.referrals_service.attributeReferral(
      profile_id,
      body.referral_code,
      { throw_on_invalid: true },
    );

    return { message: "Invitación registrada correctamente" };
  }
}
