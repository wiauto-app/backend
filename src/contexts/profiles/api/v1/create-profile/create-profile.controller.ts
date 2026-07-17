import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROFILES } from "../../../route.constants";
import { AdminCreateProfileHttpDto } from "../../v1-admin/create-profile/admin-create-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class CreateProfileController {
  constructor(private readonly profile_service: ProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() adminCreateProfileHttpDto: AdminCreateProfileHttpDto) {
    return this.profile_service.adminCreate(adminCreateProfileHttpDto);
  }
}
