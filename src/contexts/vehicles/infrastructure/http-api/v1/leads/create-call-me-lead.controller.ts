import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { CreateCallMeLeadUseCase } from "@/src/contexts/vehicles/application/leads/create-call-me-lead-use-case/create-call-me-lead.use-case";
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { V1_VEHICLE_LEADS } from "../../route.constants";
import { CreateCallMeLeadHttpDto } from "./create-call-me-lead.http-dto";

@Controller(V1_VEHICLE_LEADS)
export class CreateCallMeLeadController {
  constructor(private readonly create_call_me_lead_use_case: CreateCallMeLeadUseCase) {}

  @Post("call-me")
  @UseGuards(OptionalJwtGuard)
  create(
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
    @Body() body: CreateCallMeLeadHttpDto,
    @GetOptionalUserId() buyer_profile_id?: string,
  ) {
    return this.create_call_me_lead_use_case.execute({
      vehicle_id,
      name: body.name,
      phone: body.phone,
      phone_code: body.phone_code,
      callback_scheduled_at: body.callback_scheduled_at,
      buyer_profile_id,
    });
  }
}
