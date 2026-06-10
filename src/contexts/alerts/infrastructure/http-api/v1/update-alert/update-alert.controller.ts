import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { UpdateAlertUseCase } from "@/src/contexts/alerts/application/update-alert-use-case/update-alert.use-case";

import { V1_ALERTS } from "../../route.constants";
import { UpdateAlertHttpDto } from "./update-alert.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class UpdateAlertController {
  constructor(private readonly update_alert_use_case: UpdateAlertUseCase) {}

  @Patch(":id")
  run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
    @Body() body: UpdateAlertHttpDto,
  ) {
    return this.update_alert_use_case.execute({
      ...body,
      alert_id,
      profile_id,
    });
  }
}
