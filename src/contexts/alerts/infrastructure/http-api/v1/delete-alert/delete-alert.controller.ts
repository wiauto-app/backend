import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DeleteAlertUseCase } from "@/src/contexts/alerts/application/delete-alert-use-case/delete-alert.use-case";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class DeleteAlertController {
  constructor(private readonly delete_alert_use_case: DeleteAlertUseCase) {}

  @Delete(":id")
  async run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
  ) {
    await this.delete_alert_use_case.execute({ alert_id, profile_id });
    return { ok: true };
  }
}
