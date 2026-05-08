import { Injectable } from "@nestjs/common";

import { Roles } from "../../roles/entities/roles.entity";
import { AdminCreateProfileUseCase } from "../application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { CreateProfileUseCase } from "../application/profile/create-profile-use-case/create-profile.use-case";
import { FillMissingProfileNamesUseCase } from "../application/profile/fill-missing-profile-names-use-case/fill-missing-profile-names.use-case";
import { FindAllProfilesUseCase } from "../application/profile/find-all-profiles-use-case/find-all-profiles.use-case";
import { FindOneProfileUseCase } from "../application/profile/find-one-profile-use-case/find-one-profile.use-case";
import { RemoveProfileUseCase } from "../application/profile/remove-profile-use-case/remove-profile.use-case";
import { UpdateProfileUseCase } from "../application/profile/update-profile-use-case/update-profile.use-case";
import { PrimitiveProfile } from "../domain/entities/profile";
import { CreateProfileDto } from "../dto/create-profile";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { Profile } from "../entities/profile.entity";

@Injectable()
export class ProfileService {
  constructor(
    private readonly create_profile_use_case: CreateProfileUseCase,
    private readonly admin_create_profile_use_case: AdminCreateProfileUseCase,
    private readonly find_all_profiles_use_case: FindAllProfilesUseCase,
    private readonly find_one_profile_use_case: FindOneProfileUseCase,
    private readonly update_profile_use_case: UpdateProfileUseCase,
    private readonly remove_profile_use_case: RemoveProfileUseCase,
    private readonly fill_missing_profile_names_use_case: FillMissingProfileNamesUseCase,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = await this.create_profile_use_case.execute(createProfileDto);
    return this.to_profile_entity(profile);
  }

  /** Alta desde API admin: exige usuario existente y perfil inexistente. */
  async adminCreateProfile(dto: CreateProfileDto): Promise<Profile> {
    const profile = await this.admin_create_profile_use_case.execute(dto);
    return this.to_profile_entity(profile);
  }

  async findAll(): Promise<Profile[]> {
    const profiles = await this.find_all_profiles_use_case.execute();
    return profiles.map((profile) => this.to_profile_entity(profile));
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

  async fillMissingNames(
    userId: string,
    data: { name?: string | null; last_name?: string | null },
  ): Promise<void> {
    await this.fill_missing_profile_names_use_case.execute({
      id: userId,
      name: data.name,
      last_name: data.last_name,
    });
  }

  private to_profile_entity(profile: PrimitiveProfile): Profile {
    const entity = new Profile();
    entity.id = profile.id;
    entity.name = profile.name ?? undefined;
    entity.last_name = profile.last_name ?? undefined;
    entity.avatar_url = profile.avatar_url ?? "";
    entity.image_url = profile.image_url ?? "";
    entity.role = profile.role
      ? ({
          id: profile.role.id,
          name: profile.role.name,
          is_admin: profile.role.is_admin,
          is_developer: profile.role.is_developer,
          is_default: profile.role.is_default,
        } as Roles)
      : null;
    return entity;
  }
}
