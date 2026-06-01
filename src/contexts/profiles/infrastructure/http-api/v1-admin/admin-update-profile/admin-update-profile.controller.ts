import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { AdminUpdateProfileUseCase } from "@/src/contexts/profiles/application/profile/admin-update-profile-use-case/admin-update-profile.use-case";
import { AdminUpdateProfileHttpDto } from "./admin-update-profile.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";


@Controller(V1_ADMIN_PROFILES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateProfileController {
  constructor(private readonly adminUpdateProfileUseCase: AdminUpdateProfileUseCase) {}

  @Patch()
  update(@Body() adminUpdateProfileHttpDto: AdminUpdateProfileHttpDto) {
    return this.adminUpdateProfileUseCase.execute(adminUpdateProfileHttpDto);
  }
}