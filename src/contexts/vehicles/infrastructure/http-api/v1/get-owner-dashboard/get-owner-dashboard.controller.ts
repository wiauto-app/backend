import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetOwnerDashboardUseCase } from "@/src/contexts/vehicles/application/owner-dashboard/get-owner-dashboard-use-case/get-owner-dashboard.use-case";
import {
  DEFAULT_OWNER_DASHBOARD_PERIOD,
} from "@/src/contexts/vehicles/domain/utils/owner-dashboard-rules";

import { V1_OWNER, V1_OWNER_DASHBOARD } from "../../route.constants";
import { GetOwnerDashboardHttpDto } from "./get-owner-dashboard.http-dto";

@Controller(V1_OWNER)
@UseGuards(JwtGuard)
export class GetOwnerDashboardController {
  constructor(
    private readonly get_owner_dashboard_use_case: GetOwnerDashboardUseCase,
  ) {}

  @Get(V1_OWNER_DASHBOARD)
  run(@Query() query: GetOwnerDashboardHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.get_owner_dashboard_use_case.execute({
      profile_id: user.id,
      period: query.period ?? DEFAULT_OWNER_DASHBOARD_PERIOD,
    });
  }
}
