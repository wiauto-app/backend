import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { CreateLeadUseCase } from "@/src/contexts/vehicles/application/leads/create-lead-use-case/create-lead.use-case";
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { V1_VEHICLE_LEADS } from "../../route.constants";
import { CreateLeadHttpDto } from "./create-lead.http-dto";

@Controller(V1_VEHICLE_LEADS)
export class CreateLeadController {
  constructor(private readonly create_lead_use_case: CreateLeadUseCase) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  create(
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
    @Body() body: CreateLeadHttpDto,
    @GetOptionalUserId() buyer_profile_id?: string,
  ) {
    return this.create_lead_use_case.execute({
      vehicle_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      phone_code: body.phone_code,
      message: body.message,
      buyer_profile_id,
    });
  }
}
