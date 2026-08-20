import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
} from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { PlanAccessGrantsService } from "../../../services/plan-access-grants.service";
import { V1_ADMIN_PLAN_ACCESS_GRANTS } from "../../route.constants";
import { AssignPlanAccessGrantHttpDto } from "./assign-plan-access-grant.http-dto";

@AuthAdmin()
@Controller(V1_ADMIN_PLAN_ACCESS_GRANTS)
export class PlanAccessGrantsAdminController {
  constructor(private readonly grants_service: PlanAccessGrantsService) {}

  @Get("profiles/:profileId")
  getActive(
    @Param("profileId", ParseUUIDPipe) profile_id: string,
  ) {
    return this.grants_service.getActiveForAdmin(profile_id);
  }

  @Put("profiles/:profileId")
  assign(
    @GetUserId() admin_user_id: string,
    @Param("profileId", ParseUUIDPipe) profile_id: string,
    @Body() body: AssignPlanAccessGrantHttpDto,
  ) {
    return this.grants_service.assign({
      profile_id,
      plan_id: body.plan_id,
      expires_at: body.expires_at,
      reason: body.reason,
      granted_by_user_id: admin_user_id,
    });
  }

  @Delete("profiles/:profileId")
  @HttpCode(204)
  revoke(
    @GetUserId() admin_user_id: string,
    @Param("profileId", ParseUUIDPipe) profile_id: string,
  ) {
    return this.grants_service.revoke(profile_id, admin_user_id);
  }
}
