import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { envs } from "@/src/common/envs";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { EstimateAppraisalHttpDto } from "../../../dto/estimate-appraisal.http-dto";
import { AppraisalEstimateService } from "../../../services/appraisal-estimate.service";
import { V1_APPRAISALS } from "../../route.constants";

/** Tasación IA instantánea. Comparte el throttler `vehicle-ai` con el recomendador de precio. */
@Controller(V1_APPRAISALS)
@UseGuards(JwtGuard, ThrottlerGuard)
@Throttle({
  "vehicle-ai": {
    limit: envs.VEHICLE_AI_THROTTLE_LIMIT,
    ttl: envs.VEHICLE_AI_THROTTLE_TTL_MS,
  },
})
export class EstimateAppraisalController {
  constructor(private readonly appraisal_estimate_service: AppraisalEstimateService) {}

  @Post("estimate")
  @HttpCode(HttpStatus.CREATED)
  estimate(@GetUserId() profile_id: string, @Body() body: EstimateAppraisalHttpDto) {
    return this.appraisal_estimate_service.estimate(profile_id, body);
  }
}
