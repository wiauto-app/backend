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
import { OwnerStatisticsService } from "@/src/contexts/vehicles/services/owner-statistics.service";

import { V1_OWNER, V1_OWNER_STATISTICS } from "../../route.constants";
import { GetOwnerStatisticsHttpDto } from "./get-owner-statistics.http-dto";

@Controller(V1_OWNER)
@UseGuards(JwtGuard)
export class GetOwnerStatisticsController {
  constructor(
    private readonly owner_statistics_service: OwnerStatisticsService,
  ) {}

  @Get(V1_OWNER_STATISTICS)
  run(@Query() query: GetOwnerStatisticsHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.owner_statistics_service.getStatistics({
      profile_id: user.id,
      since: query.since,
      until: query.until,
      granularity: query.granularity,
    });
  }
}
