import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";

@Injectable()
export class FindAllProfilesUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(): Promise<PrimitiveProfile[]> {
    const profiles = await this.profile_repository.findAll();
    return profiles.map((profile) => profile.toPrimitives());
  }
}
