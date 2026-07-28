import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";

import { AppraisalRequestsService } from "../../services/appraisal-requests.service";
import { V1_ADMIN_APPRAISAL_REQUESTS } from "../route.constants";
import { FindAllAppraisalRequestsHttpDto } from "../../dto/find-all-appraisal-requests.http-dto";
import { RespondAppraisalRequestHttpDto } from "../../dto/respond-appraisal-request.http-dto";

@Controller(V1_ADMIN_APPRAISAL_REQUESTS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AppraisalRequestsAdminController {
  constructor(private readonly appraisal_requests_service: AppraisalRequestsService) {}

  @Get()
  findAll(@Query() query: FindAllAppraisalRequestsHttpDto) {
    return this.appraisal_requests_service.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      priority: query.priority,
    });
  }

  @Patch(":id/respond")
  respond(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: RespondAppraisalRequestHttpDto,
  ) {
    return this.appraisal_requests_service.respond(id, {
      estimated_price_min: body.estimated_price_min,
      estimated_price_max: body.estimated_price_max,
      admin_note: body.admin_note,
    });
  }

  @Patch(":id/close")
  close(@Param("id", ParseUUIDPipe) id: string) {
    return this.appraisal_requests_service.close(id);
  }
}
