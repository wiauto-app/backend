import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { AdminUpdateProfileHttpDto } from "./admin-update-profile.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminGuard } from "@/src/contexts/auth/guards/admin.guard";


@Controller(V1_ADMIN_PROFILES)
@UseGuards(JwtGuard, AdminGuard)
export class AdminUpdateProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Patch()
  update(@Body() adminUpdateProfileHttpDto: AdminUpdateProfileHttpDto) {
    return this.profile_service.adminUpdate(adminUpdateProfileHttpDto);
  }
}