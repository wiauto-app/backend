import { ConflictException, NotFoundException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { ProfileUserRepository } from "../../../domain/repositories/profile-user.repository";
import { CreateProfileDto } from "../create-profile-use-case/create-profile.dto";
import { CreateProfileUseCase } from "../create-profile-use-case/create-profile.use-case";

@Injectable()
export class AdminCreateProfileUseCase {
  constructor(
    private readonly profile_repository: ProfileRepository,
    private readonly create_profile_use_case: CreateProfileUseCase,
    private readonly user_repository: ProfileUserRepository,
  ) {}

  async execute(create_profile_dto: CreateProfileDto): Promise<PrimitiveProfile> {
    const user_exists = await this.user_repository.exists(create_profile_dto.id);
    if (!user_exists) {
      throw new NotFoundException("No se encontró el usuario");
    }

    const profile_exists = await this.profile_repository.exists(create_profile_dto.id);
    if (profile_exists) {
      throw new ConflictException("Ya existe un perfil para este usuario");
    }

    return this.create_profile_use_case.execute(create_profile_dto);
  }
}
