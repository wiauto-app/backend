import { Injectable } from "@nestjs/common";

import { AdminCreateProfileUseCase } from "../application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { CreateProfileUseCase } from "../application/profile/create-profile-use-case/create-profile.use-case";
import { FindAllProfilesUseCase } from "../application/profile/find-all-profiles-use-case/find-all-profiles.use-case";
import { FindOneProfileUseCase } from "../application/profile/find-one-profile-use-case/find-one-profile.use-case";
import { RemoveProfileUseCase } from "../application/profile/remove-profile-use-case/remove-profile.use-case";
import { UpdateProfileUseCase } from "../application/profile/update-profile-use-case/update-profile.use-case";
import { PrimitiveProfile, Profile } from "../domain/entities/profile";
import { CreateProfileDto } from "../dto/create-profile";
import { UpdateProfileDto } from "../dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(
    private readonly create_profile_use_case: CreateProfileUseCase,
    private readonly admin_create_profile_use_case: AdminCreateProfileUseCase,
    private readonly find_all_profiles_use_case: FindAllProfilesUseCase,
    private readonly find_one_profile_use_case: FindOneProfileUseCase,
    private readonly update_profile_use_case: UpdateProfileUseCase,
    private readonly remove_profile_use_case: RemoveProfileUseCase,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = await this.create_profile_use_case.execute(createProfileDto);
    return new Profile(profile);
  }


  async updateProfile(user_id: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.update_profile_use_case.execute({
      id: user_id,
      ...dto,
    });
    return this.to_profile_entity(profile);
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.find_one_profile_use_case.execute({ id });
    return this.to_profile_entity(profile);
  }

  async removeProfile(id: string): Promise<void> {
    await this.remove_profile_use_case.execute({ id });
  }



  private to_profile_entity(profile: PrimitiveProfile): Profile {
    const entity = new Profile(profile);
    return entity;
  }
}
