import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { AdminCreateProfileUseCase } from "../../../../application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { V1_PROFILES } from "../../../../route.constants";
import { AdminCreateProfileHttpDto } from "../../v1-admin/create-profile/admin-create-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class CreateProfileController {
  constructor(
    private readonly adminCreateProfileUseCase: AdminCreateProfileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() adminCreateProfileHttpDto: AdminCreateProfileHttpDto) {
    return this.adminCreateProfileUseCase.execute(adminCreateProfileHttpDto);
  }
}
