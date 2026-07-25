import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";
import { CreateAlertHttpDto } from "./create-alert.http-dto";

@Controller(V1_ALERTS)
export class CreateAlertController {
  constructor(private readonly alert_service: AlertService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtGuard)
  run(
    @GetOptionalUserId() profile_id: string | undefined,
    @Body() body: CreateAlertHttpDto,
  ) {
    return this.alert_service.create({
      ...body,
      profile_id: profile_id ?? null,
    });
  }
}
