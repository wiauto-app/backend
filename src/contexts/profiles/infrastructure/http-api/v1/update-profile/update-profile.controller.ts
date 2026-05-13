import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UpdateProfileUseCase } from "../../../../application/profile/update-profile-use-case/update-profile.use-case";
import { V1_PROFILES } from "../../../../route.constants";
import { UpdateProfileHttpDto } from "./update-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class UpdateProfileController {
  constructor(
    private readonly update_profile_use_case: UpdateProfileUseCase,
  ) {}

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_profile_http_dto: UpdateProfileHttpDto,
  ) {
    return this.update_profile_use_case.execute({
      id,
      ...update_profile_http_dto,
    });
  }
}
