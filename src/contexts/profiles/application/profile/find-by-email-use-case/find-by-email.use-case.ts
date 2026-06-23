import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { FindByEmailDto } from "./find-by-email.dto";

@Injectable()
export class FindByEmailUseCase {
  constructor(private readonly profile_repository: ProfileRepository) {}

  async execute(find_by_email_dto: FindByEmailDto): Promise<PrimitiveProfile> {
    const profile = await this.profile_repository.findByEmail(find_by_email_dto.email);
    
    if (!profile) {
      throw new ProfileNotFoundException(find_by_email_dto.email);
    }
    return profile.toPrimitives();
  }
}