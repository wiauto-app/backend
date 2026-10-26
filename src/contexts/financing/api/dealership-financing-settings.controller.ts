import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RequireSubscription } from "@/src/contexts/billing/decorators/require-subscription.decorator";
import { SubscriptionGuard } from "@/src/contexts/billing/guards/subscription.guard";
import { DealershipTeamManagerGuard } from "@/src/contexts/dealership/guards/dealership-team-manager.guard";

import { PatchDealershipFinancingSettingsHttpDto } from "../dto/patch-dealership-financing-settings.http-dto";
import { DealershipFinancingService } from "../services/dealership-financing.service";
import { V1_FINANCING_SETTINGS } from "./route.constants";

@Controller(V1_FINANCING_SETTINGS)
@UseGuards(JwtGuard, SubscriptionGuard, DealershipTeamManagerGuard)
@RequireSubscription()
export class DealershipFinancingSettingsController {
  constructor(
    private readonly dealership_financing_service: DealershipFinancingService,
  ) {}

  @Get()
  get(@GetUserId() profile_id: string) {
    return this.dealership_financing_service.getForProfile(profile_id);
  }

  @Patch()
  patch(
    @GetUserId() profile_id: string,
    @Body() body: PatchDealershipFinancingSettingsHttpDto,
  ) {
    return this.dealership_financing_service.patchForProfile(profile_id, body);
  }
}
