import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";
import { CreateAlertHttpDto } from "./create-alert.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class CreateAlertController {
  constructor(private readonly alert_service: AlertService) {}

  @Post()
  run(@GetUserId() profile_id: string, @Body() body: CreateAlertHttpDto) {
    return this.alert_service.create({ ...body, profile_id });
  }
}
