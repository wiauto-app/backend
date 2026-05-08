import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { FindOneProfileDto } from "./find-one-profile.dto";

@Injectable()
export class FindOneProfileUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(find_one_profile_dto: FindOneProfileDto): Promise<PrimitiveProfile> {
    const profile = await this.profile_repository.findOne(find_one_profile_dto.id);
    if (!profile) {
      throw new ProfileNotFoundException(find_one_profile_dto.id);
    }

    return profile.toPrimitives();
  }
}
