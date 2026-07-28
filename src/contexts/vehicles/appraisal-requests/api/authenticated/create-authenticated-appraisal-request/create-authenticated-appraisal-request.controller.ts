import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { CreateAppraisalRequestHttpDto } from "../../../dto/create-appraisal-request.http-dto";
import { AppraisalRequestsService } from "../../../services/appraisal-requests.service";
import { V1_APPRAISAL_REQUESTS } from "../../route.constants";

@Controller(V1_APPRAISAL_REQUESTS)
@UseGuards(JwtGuard)
export class CreateAuthenticatedAppraisalRequestController {
  constructor(private readonly appraisal_requests_service: AppraisalRequestsService) {}

  @Post("authenticated")
  create(
    @GetUserId() profile_id: string,
    @Body() body: CreateAppraisalRequestHttpDto,
  ) {
    return this.appraisal_requests_service.createAuthenticated({
      ...body,
      profile_id,
    });
  }
}
