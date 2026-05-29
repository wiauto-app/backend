import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UpdateMyProfileUseCase } from "../../../../application/profile/update-my-profile-use-case/update-my-profile.use-case";
import { UpdateMyProfileHttpDto } from "./update-my-profile.http-dto";

@UseGuards(JwtGuard)
@Controller("auth/me")
export class UpdateMyProfileController {
  constructor(
    private readonly update_my_profile_use_case: UpdateMyProfileUseCase,
  ) {}

  @Patch("profile")
  updateMyProfile(
    @GetUserId() user_id: string,
    @Body() update_my_profile_http_dto: UpdateMyProfileHttpDto,
  ) {
    return this.update_my_profile_use_case.execute({
      user_id,
      ...update_my_profile_http_dto,
    });
  }
}
