import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROFILES } from "../../../route.constants";
import { FindAllProfilesHttpDto } from "./find-all-profiles.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class FindAllProfilesController {
  constructor(private readonly profile_service: ProfileService) {}

  @Get()
  findAll(@Query() findAllProfilesHttpDto: FindAllProfilesHttpDto) {
    return this.profile_service.findAll(findAllProfilesHttpDto);
  }
}
