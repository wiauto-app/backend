import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { AppraisalEstimateService } from "../../../services/appraisal-estimate.service";
import { V1_APPRAISALS } from "../../route.constants";

@Controller(V1_APPRAISALS)
@UseGuards(JwtGuard)
export class MyAppraisalsController {
  constructor(private readonly appraisal_estimate_service: AppraisalEstimateService) {}

  @Get("me")
  findAll(@GetUserId() profile_id: string) {
    return this.appraisal_estimate_service.findAllMine(profile_id);
  }

  @Get(":id")
  findOne(@GetUserId() profile_id: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.appraisal_estimate_service.findMine(profile_id, id);
  }
}
