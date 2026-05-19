import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";
import { UpdateProfilePayload } from "../../../domain/payloads/update-profile.payload";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { UpdateProfileDto } from "./update-profile.dto";

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(update_profile_dto: UpdateProfileDto): Promise<PrimitiveProfile> {
    const { id, ...patch_fields } = update_profile_dto;
    const profile = await this.profile_repository.findOne(id);
    if (!profile) {
      throw new ProfileNotFoundException(id);
    }

    const payload: UpdateProfilePayload = { id, ...patch_fields };
    const updated = profile.update(payload);
    await this.profile_repository.update(id, updated);
    return updated.toPrimitives();
  }
}
