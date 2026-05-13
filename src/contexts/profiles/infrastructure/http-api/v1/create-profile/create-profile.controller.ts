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
import { CreateProfileHttpDto } from "./create-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class CreateProfileController {
  constructor(
    private readonly admin_create_profile_use_case: AdminCreateProfileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() create_profile_http_dto: CreateProfileHttpDto) {
    return this.admin_create_profile_use_case.execute(create_profile_http_dto);
  }
}
