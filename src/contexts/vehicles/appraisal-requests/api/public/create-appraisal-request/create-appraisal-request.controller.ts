import { Body, Controller, Post } from "@nestjs/common";

import { AppraisalRequestsService } from "../../../services/appraisal-requests.service";
import { V1_APPRAISAL_REQUESTS } from "../../route.constants";
import { CreateAppraisalRequestHttpDto } from "../../../dto/create-appraisal-request.http-dto";

@Controller(V1_APPRAISAL_REQUESTS)
export class CreateAppraisalRequestController {
  constructor(private readonly appraisal_requests_service: AppraisalRequestsService) {}

  @Post()
  create(@Body() body: CreateAppraisalRequestHttpDto) {
    return this.appraisal_requests_service.create(body);
  }
}
