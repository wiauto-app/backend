import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { LeadsService } from "@/src/contexts/vehicles/services/leads.service";
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
  constructor(private readonly leads_service: LeadsService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  create(
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
    @Body() body: CreateLeadHttpDto,
    @GetOptionalUserId() buyer_profile_id?: string,
  ) {
    return this.leads_service.createContact({
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
