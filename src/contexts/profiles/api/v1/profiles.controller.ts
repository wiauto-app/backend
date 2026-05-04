import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateProfileDto } from "../../dto/create-profile";
import { UpdateProfileDto } from "../../dto/update-profile.dto";
import { ProfileService } from "../../services/profile.service";
import { V1_PROFILES } from "../../route.constants";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class ProfilesController {
  constructor(private readonly profile_service: ProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() create_profile_dto: CreateProfileDto) {
    return this.profile_service.adminCreateProfile(create_profile_dto);
  }

  @Get()
  findAll() {
    return this.profile_service.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.profile_service.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_profile_dto: UpdateProfileDto,
  ) {
    return this.profile_service.updateProfile(id, update_profile_dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.profile_service.removeProfile(id);
  }
}
