import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROFILES } from "../../../route.constants";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class RemoveProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.profile_service.removeProfile(id);
  }
}
