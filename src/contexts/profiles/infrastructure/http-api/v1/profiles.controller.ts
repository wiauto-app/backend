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

import { AdminCreateProfileUseCase } from "../../../application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { FindAllProfilesUseCase } from "../../../application/profile/find-all-profiles-use-case/find-all-profiles.use-case";
import { FindOneProfileUseCase } from "../../../application/profile/find-one-profile-use-case/find-one-profile.use-case";
import { RemoveProfileUseCase } from "../../../application/profile/remove-profile-use-case/remove-profile.use-case";
import { UpdateProfileUseCase } from "../../../application/profile/update-profile-use-case/update-profile.use-case";
import { V1_PROFILES } from "../../../route.constants";
import { CreateProfileHttpDto } from "./create-profile/create-profile.http-dto";
import { UpdateProfileHttpDto } from "./update-profile/update-profile.http-dto";

@UseGuards(JwtGuard)
@Controller(V1_PROFILES)
export class ProfilesController {
  constructor(
    private readonly admin_create_profile_use_case: AdminCreateProfileUseCase,
    private readonly find_all_profiles_use_case: FindAllProfilesUseCase,
    private readonly find_one_profile_use_case: FindOneProfileUseCase,
    private readonly update_profile_use_case: UpdateProfileUseCase,
    private readonly remove_profile_use_case: RemoveProfileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() create_profile_http_dto: CreateProfileHttpDto) {
    return this.admin_create_profile_use_case.execute(create_profile_http_dto);
  }

  @Get()
  findAll() {
    return this.find_all_profiles_use_case.execute();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.find_one_profile_use_case.execute({ id });
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_profile_http_dto: UpdateProfileHttpDto,
  ) {
    return this.update_profile_use_case.execute({
      id,
      ...update_profile_http_dto,
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.remove_profile_use_case.execute({ id });
  }
}
