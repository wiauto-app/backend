import { Honeypot } from "@/src/common/antispam/honeypot";
import { OptInThrottle } from "@/src/common/antispam/opt-in-throttle.decorator";
import { THROTTLER_NAME } from "@/src/common/antispam/throttler-names";
import { envs } from "@/src/common/envs";
import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { LeadsService } from "@/src/contexts/vehicles/services/leads.service";
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { V1_VEHICLE_LEADS } from "../../route.constants";
import { fakeFinancingLeadResponse } from "./honeypot-lead.response";
import { CreateFinancingLeadHttpDto } from "./create-financing-lead.http-dto";

@Controller(V1_VEHICLE_LEADS)
export class CreateFinancingLeadController {
  constructor(private readonly leads_service: LeadsService) {}

  @Post("financing")
  @UseGuards(OptionalJwtGuard)
  @OptInThrottle(THROTTLER_NAME.PUBLIC_LEADS, {
    limit: envs.PUBLIC_LEADS_THROTTLE_LIMIT,
    ttl: envs.PUBLIC_LEADS_THROTTLE_TTL_MS,
  })
  @Honeypot(fakeFinancingLeadResponse)
  create(
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
    @Body() body: CreateFinancingLeadHttpDto,
    @GetOptionalUserId() buyer_profile_id?: string,
  ) {
    return this.leads_service.createFinancing({
      ...body,
      vehicle_id,
      buyer_profile_id,
    });
  }
}
