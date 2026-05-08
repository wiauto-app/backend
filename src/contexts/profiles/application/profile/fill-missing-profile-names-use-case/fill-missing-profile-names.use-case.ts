import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { FillMissingProfileNamesDto } from "./fill-missing-profile-names.dto";

@Injectable()
export class FillMissingProfileNamesUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(fill_missing_profile_names_dto: FillMissingProfileNamesDto): Promise<void> {
    const profile = await this.profile_repository.findOne(fill_missing_profile_names_dto.id);
    if (!profile) {
      return;
    }

    const updated = profile.fill_missing_names({
      name: fill_missing_profile_names_dto.name,
      last_name: fill_missing_profile_names_dto.last_name,
    });

    if (profile.has_same_names(updated)) {
      return;
    }

    await this.profile_repository.update(updated);
  }
}
