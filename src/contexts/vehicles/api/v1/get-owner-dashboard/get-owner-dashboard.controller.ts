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
import { OwnerDashboardService } from "@/src/contexts/vehicles/services/owner-dashboard.service";

import { V1_OWNER, V1_OWNER_DASHBOARD } from "../../route.constants";
import { GetOwnerDashboardHttpDto } from "./get-owner-dashboard.http-dto";

@Controller(V1_OWNER)
@UseGuards(JwtGuard)
export class GetOwnerDashboardController {
  constructor(
    private readonly owner_dashboard_service: OwnerDashboardService,
  ) {}

  @Get(V1_OWNER_DASHBOARD)
  run(@Query() query: GetOwnerDashboardHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.owner_dashboard_service.getDashboard({
      profile_id: user.id,
      start_date: query.start_date,
      end_date: query.end_date,
    });
  }
}
