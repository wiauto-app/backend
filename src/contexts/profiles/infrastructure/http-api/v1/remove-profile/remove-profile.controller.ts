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

import { RemoveProfileUseCase } from "../../../../application/profile/remove-profile-use-case/remove-profile.use-case";
import { V1_PROFILES } from "../../../../route.constants";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class RemoveProfileController {
  constructor(
    private readonly remove_profile_use_case: RemoveProfileUseCase,
  ) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.remove_profile_use_case.execute({ id });
  }
}
