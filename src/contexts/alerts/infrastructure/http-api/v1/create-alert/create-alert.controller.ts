import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateAlertUseCase } from "@/src/contexts/alerts/application/create-alert-use-case/create-alert.use-case";

import { V1_ALERTS } from "../../route.constants";
import { CreateAlertHttpDto } from "./create-alert.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class CreateAlertController {
  constructor(private readonly create_alert_use_case: CreateAlertUseCase) {}

  @Post()
  run(@GetUserId() profile_id: string, @Body() body: CreateAlertHttpDto) {
    return this.create_alert_use_case.execute({
      ...body,
      profile_id,
    });
  }
}
