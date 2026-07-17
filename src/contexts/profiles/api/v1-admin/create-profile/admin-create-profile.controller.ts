import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminCreateProfileHttpDto } from "./admin-create-profile.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
@Controller(V1_ADMIN_PROFILES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminCreateProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Post()
  create(@Body() createProfileHttpDto: AdminCreateProfileHttpDto) {
    return this.profile_service.adminCreate(createProfileHttpDto);
  }
}
