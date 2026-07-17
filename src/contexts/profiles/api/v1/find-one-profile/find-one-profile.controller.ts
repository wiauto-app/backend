import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROFILES } from "../../../route.constants";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class FindOneProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.profile_service.findOnePrimitives(id);
  }
}
