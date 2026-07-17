import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UpdateMyProfileHttpDto } from "./update-my-profile.http-dto";

@UseGuards(JwtGuard)
@Controller("auth/me")
export class UpdateMyProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Patch("profile")
  updateMyProfile(
    @GetUserId() user_id: string,
    @Body() update_my_profile_http_dto: UpdateMyProfileHttpDto,
  ) {
    return this.profile_service.updateMyProfile({
      user_id,
      ...update_my_profile_http_dto,
    });
  }
}
