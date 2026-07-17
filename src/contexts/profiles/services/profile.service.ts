import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "@/src/contexts/dealership/types/dealership-member";
import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

import { PrimitiveProfile, Profile } from "../types/profile";
import { ProfileNotFoundException } from "../exceptions/profile-not-found.exception";
import { ProfileFilter } from "../types/profile.filter";
import { CreateProfilePayload } from "../types/create-profile.payload";
import { UpdateProfilePayload } from "../types/update-profile.payload";
import { TypeOrmAdminProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.admin-profile-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { CreateProfileDto } from "../dto/create-profile";
import { UpdateProfileDto } from "../dto/update-profile.dto";

const dealership_member_roles = new Set<PrimitiveDealershipMember["role"]>([
  "owner",
  "admin",
  "member"]);

export interface AdminCreateProfileInput {
  id: string;
  name: string;
  last_name: string;
  role_id: string;
  avatar_url?: string;
  image_url?: string;
}

export interface AdminUpdateProfileInput {
  id: string;
  name?: string;
  last_name?: string;
  role_id?: string;
  avatar_url?: string;
  image_url?: string;
}

export interface FindAllProfilesInput {
  name?: string;
  role_id?: string;
  email?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export interface UpdateMyProfileInput {
  user_id: string;
  name?: string;
  last_name?: string;
  avatar_url?: string;
  image_url?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly admin_profile_repository: TypeOrmAdminProfileRepository,
    private readonly dealership_invitation_repository: TypeOrmDealershipInvitationRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto): Promise<Profile> {
    const primitives = await this.create(createProfileDto);
    return new Profile(primitives);
  }

  async create(input: {
    id: string;
    name: string;
    last_name?: string;
    avatar_url?: string;
    image_url?: string;
    role_id: string;
  }): Promise<PrimitiveProfile> {
    const email = await this.profile_user_repository.findEmailById(input.id);
    const accepted_invitation = email
      ? await this.dealership_invitation_repository.findAcceptedByEmail(email)
      : null;
    const dealership_member_role = accepted_invitation
      ? this.toDealershipMemberRole(accepted_invitation.role)
      : null;

    const payload = this.toCreatePayload(input);
    const profile = Profile.create(payload);
    await this.profile_repository.save(profile);

    if (accepted_invitation && dealership_member_role) {
      const member_exists =
        await this.dealership_member_repository.existsByDealershipIdAndProfileId(
          accepted_invitation.dealership_id,
          input.id,
        );

      if (!member_exists) {
        const dealership_member = DealershipMember.create({
          dealership_id: accepted_invitation.dealership_id,
          profile_id: input.id,
          role: dealership_member_role,
        });
        await this.dealership_member_repository.save(dealership_member);
      }
    }

    return profile.toPrimitives();
  }

  async adminCreate(
    input: AdminCreateProfileInput,
  ): Promise<PrimitiveProfile> {
    const user_exists = await this.profile_user_repository.exists(input.id);
    if (!user_exists) {
      throw new NotFoundException("No se encontró el usuario");
    }

    const profile = Profile.create(input);
    await this.admin_profile_repository.create(profile);
    return profile.toPrimitives();
  }

  async adminUpdate(
    input: AdminUpdateProfileInput,
  ): Promise<PrimitiveProfile> {
    const currentProfile = await this.admin_profile_repository.findOne(
      input.id,
    );
    if (!currentProfile) {
      throw new ProfileNotFoundException(input.id);
    }

    const updatedProfile = currentProfile.update(input);
    await this.admin_profile_repository.update(updatedProfile);
    return updatedProfile.toPrimitives();
  }

  async findAll(
    input: FindAllProfilesInput,
  ): Promise<PaginatedResult<PrimitiveProfile>> {
    const filter = new ProfileFilter({
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
      name: input.name,
      role_id: input.role_id,
      email: input.email,
    });
    const profiles = await this.profile_repository.findAll(filter);
    return profiles.map((profile) => profile.toPrimitives());
  }

  async findOne(id: string): Promise<Profile> {
    const primitives = await this.findOnePrimitives(id);
    return new Profile(primitives);
  }

  async findOnePrimitives(id: string): Promise<PrimitiveProfile> {
    const profile = await this.profile_repository.findOne(id);
    if (!profile) {
      throw new ProfileNotFoundException(id);
    }
    return profile.toPrimitives();
  }

  async findByEmail(email: string): Promise<PrimitiveProfile> {
    const profile = await this.profile_repository.findByEmail(email);
    if (!profile) {
      throw new ProfileNotFoundException(email);
    }
    return profile.toPrimitives();
  }

  async updateProfile(user_id: string, dto: UpdateProfileDto): Promise<Profile> {
    const primitives = await this.update({ id: user_id, ...dto });
    return new Profile(primitives);
  }

  async update(input: {
    id: string;
    name?: string;
    last_name?: string;
    avatar_url?: string;
    image_url?: string;
    role_id?: string;
  }): Promise<PrimitiveProfile> {
    const { id, ...patch_fields } = input;
    const profile = await this.profile_repository.findOne(id);
    if (!profile) {
      throw new ProfileNotFoundException(id);
    }

    const payload: UpdateProfilePayload = { id, ...patch_fields };
    const updated = profile.update(payload);
    await this.profile_repository.update(id, updated);
    return updated.toPrimitives();
  }

  async updateMyProfile(
    input: UpdateMyProfileInput,
  ): Promise<PrimitiveProfile> {
    const { user_id, ...patch_fields } = input;
    const profile = await this.profile_repository.findOne(user_id);
    if (!profile) {
      throw new ProfileNotFoundException(user_id);
    }

    const payload: UpdateProfilePayload = { id: user_id, ...patch_fields };
    const updated = profile.update(payload);
    await this.profile_repository.update(user_id, updated);
    return updated.toPrimitives();
  }

  async removeProfile(id: string): Promise<void> {
    const profile_exists = await this.profile_repository.exists(id);
    if (!profile_exists) {
      throw new ProfileNotFoundException(id);
    }
    await this.profile_repository.delete(id);
  }

  private toCreatePayload(dto: {
    id: string;
    name: string;
    last_name?: string;
    avatar_url?: string;
    image_url?: string;
    role_id: string;
  }): CreateProfilePayload {
    const payload = new CreateProfilePayload();
    payload.name = dto.name;
    payload.last_name = dto.last_name;
    payload.avatar_url = dto.avatar_url;
    payload.image_url = dto.image_url;
    payload.role_id = dto.role_id;
    payload.id = dto.id;
    return payload;
  }

  private toDealershipMemberRole(
    role: string,
  ): PrimitiveDealershipMember["role"] {
    if (dealership_member_roles.has(role as PrimitiveDealershipMember["role"])) {
      return role as PrimitiveDealershipMember["role"];
    }

    throw new BadRequestException(`La invitación tiene un rol inválido: ${role}`);
  }
}
