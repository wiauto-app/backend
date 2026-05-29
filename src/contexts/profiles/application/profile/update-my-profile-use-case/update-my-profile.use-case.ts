import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";
import { UpdateProfilePayload } from "../../../domain/payloads/update-profile.payload";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { UpdateMyProfileDto } from "./update-my-profile.dto";

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(update_my_profile_dto: UpdateMyProfileDto): Promise<PrimitiveProfile> {
    const { user_id, ...patch_fields } = update_my_profile_dto;
    const profile = await this.profile_repository.findOne(user_id);
    if (!profile) {
      throw new ProfileNotFoundException(user_id);
    }

    const payload: UpdateProfilePayload = { id: user_id, ...patch_fields };
    const updated = profile.update(payload);
    await this.profile_repository.update(user_id, updated);
    return updated.toPrimitives();
  }
}
