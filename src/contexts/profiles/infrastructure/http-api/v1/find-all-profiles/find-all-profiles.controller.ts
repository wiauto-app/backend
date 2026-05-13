import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { FindAllProfilesUseCase } from "../../../../application/profile/find-all-profiles-use-case/find-all-profiles.use-case";
import { V1_PROFILES } from "../../../../route.constants";
import { FindAllProfilesHttpDto } from "./find-all-profiles.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class FindAllProfilesController {
  constructor(
    private readonly findAllProfilesUseCase: FindAllProfilesUseCase,
  ) {}

  @Get()
  findAll(@Query() findAllProfilesHttpDto: FindAllProfilesHttpDto) {
    return this.findAllProfilesUseCase.execute(findAllProfilesHttpDto);
  }
}
