import { V1_ADMIN_PROFILES } from "@/src/contexts/profiles/route.constants";
import { Body, Controller, Patch } from "@nestjs/common";
import { AdminUpdateProfileUseCase } from "@/src/contexts/profiles/application/profile/admin-update-profile-use-case/admin-update-profile.use-case";
import { AdminUpdateProfileHttpDto } from "./admin-update-profile.http-dto";


@Controller(V1_ADMIN_PROFILES)
export class AdminUpdateProfileController {
  constructor(private readonly adminUpdateProfileUseCase: AdminUpdateProfileUseCase) {}

  @Patch()
  update(@Body() adminUpdateProfileHttpDto: AdminUpdateProfileHttpDto) {
    return this.adminUpdateProfileUseCase.execute(adminUpdateProfileHttpDto);
  }
}