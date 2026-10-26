import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { DealershipFinancingService } from "../services/dealership-financing.service";
import { V1_FINANCING_STATUS } from "./route.constants";

@Controller(V1_FINANCING_STATUS)
@UseGuards(JwtGuard)
export class DealershipFinancingStatusController {
  constructor(
    private readonly dealership_financing_service: DealershipFinancingService,
  ) {}

  @Get()
  get(@GetUserId() profile_id: string) {
    return this.dealership_financing_service.getStatusForProfile(profile_id);
  }
}
