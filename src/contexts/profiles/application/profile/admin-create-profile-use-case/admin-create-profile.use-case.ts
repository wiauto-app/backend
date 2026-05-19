import { NotFoundException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile, Profile } from "../../../domain/entities/profile";
import { ProfileUserRepository } from "../../../domain/repositories/profile-user.repository";
import { AdminProfileRepository } from "../../../domain/repositories/admin-profile.repository";
import { AdminCreateProfileDto } from "./admin-create-profile.dto";

@Injectable()
export class AdminCreateProfileUseCase {
  constructor(
    private readonly adminProfileRepository: AdminProfileRepository,
    private readonly userRepository: ProfileUserRepository,
  ) {}

  async execute(adminCreateProfileDto: AdminCreateProfileDto): Promise<PrimitiveProfile> {
    const user_exists = await this.userRepository.exists(adminCreateProfileDto.id);
    if (!user_exists) {
      throw new NotFoundException("No se encontró el usuario");
    }

    const profile = Profile.create(adminCreateProfileDto);
    await this.adminProfileRepository.create(profile);
    return profile.toPrimitives();
  }
}
