import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { AdminProfileRepository } from "../../../domain/repositories/admin-profile.repository";
import { AdminUpdateProfileDto } from "./admin-update-profile.dto";
import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileNotFoundException } from "../../../domain/exceptions/profile-not-found.exception";

@Injectable()
export class AdminUpdateProfileUseCase {
  constructor(private readonly adminProfileRepository: AdminProfileRepository) { }

  async execute(adminUpdateProfileDto: AdminUpdateProfileDto): Promise<PrimitiveProfile> {
    const currentProfile = await this.adminProfileRepository.findOne(adminUpdateProfileDto.id);
    if (!currentProfile) {
      throw new ProfileNotFoundException(adminUpdateProfileDto.id);
    }

    const updatedProfile = currentProfile.update(adminUpdateProfileDto);
    await this.adminProfileRepository.update(updatedProfile);
    return updatedProfile.toPrimitives();

  }
}