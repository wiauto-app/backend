import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Post } from "@nestjs/common";
import { AdminCreateProfileUseCase } from "@/src/contexts/profiles/application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { AdminCreateProfileHttpDto } from "./admin-create-profile.http-dto";
@Controller(V1_ADMIN_PROFILES)
export class AdminCreateProfileController {
  constructor(private readonly adminCreateProfileUseCase: AdminCreateProfileUseCase) {}

  @Post()
  create(@Body() createProfileHttpDto: AdminCreateProfileHttpDto) {
    return this.adminCreateProfileUseCase.execute(createProfileHttpDto);
  }
}
