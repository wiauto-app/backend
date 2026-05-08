import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { RemoveProfileDto } from "./remove-profile.dto";

@Injectable()
export class RemoveProfileUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(remove_profile_dto: RemoveProfileDto): Promise<void> {
    const profile_exists = await this.profile_repository.exists(remove_profile_dto.id);
    if (!profile_exists) {
      throw new ProfileNotFoundException(remove_profile_dto.id);
    }

    await this.profile_repository.delete(remove_profile_dto.id);
  }
}
