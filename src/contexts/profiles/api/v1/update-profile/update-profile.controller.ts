import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROFILES } from "../../../route.constants";
import { UpdateProfileHttpDto } from "./update-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class UpdateProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_profile_http_dto: UpdateProfileHttpDto,
  ) {
    return this.profile_service.update({
      id,
      ...update_profile_http_dto,
    });
  }
}
