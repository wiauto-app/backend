import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminCreateProfileUseCase } from "@/src/contexts/profiles/application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { AdminCreateProfileHttpDto } from "./admin-create-profile.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
@Controller(V1_ADMIN_PROFILES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminCreateProfileController {
  constructor(private readonly adminCreateProfileUseCase: AdminCreateProfileUseCase) {}

  @Post()
  create(@Body() createProfileHttpDto: AdminCreateProfileHttpDto) {
    return this.adminCreateProfileUseCase.execute(createProfileHttpDto);
  }
}
