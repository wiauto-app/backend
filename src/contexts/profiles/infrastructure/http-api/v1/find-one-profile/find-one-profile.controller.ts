import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { FindOneProfileUseCase } from "../../../../application/profile/find-one-profile-use-case/find-one-profile.use-case";
import { V1_PROFILES } from "../../../../route.constants";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class FindOneProfileController {
  constructor(
    private readonly find_one_profile_use_case: FindOneProfileUseCase,
  ) {}

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.find_one_profile_use_case.execute({ id });
  }
}
