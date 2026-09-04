import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "@/src/contexts/dealership/types/dealership-member";
import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { TypeOrmAlertRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-repository";
import { NewsletterService } from "@/src/contexts/newsletter/services/newsletter.service";

import {
  mapProfileToResponse,
  type ProfileResponse,
} from "../types/profile";
import { ProfileNotFoundException } from "../exceptions/profile-not-found.exception";
import { ProfileFilter } from "../types/profile.filter";
import { TypeOrmAdminProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.admin-profile-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { CreateProfileDto } from "../dto/create-profile";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "@nestjs/cache-manager";
import { UpdateMyProfileHttpDto } from "../api/auth-me/update-my-profile/update-my-profile.http-dto";

const dealership_member_roles = new Set<PrimitiveDealershipMember["role"]>([
  "owner",
  "admin",
  "member",
]);

export interface AdminCreateProfileInput {
  id: string;
  name: string;
  last_name: string;
  avatar_url?: string;
  image_url?: string;
}

export interface AdminUpdateProfileInput {
  id: string;
  name?: string;
  last_name?: string;
  avatar_url?: string;
  image_url?: string;
}

export interface FindAllProfilesInput {
  name?: string;
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
  phone_code?: string;
  phone?: string;
  avatar_url?: string;
  image_url?: string;
  province_id?: number;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly admin_profile_repository: TypeOrmAdminProfileRepository,
    private readonly dealership_invitation_repository: TypeOrmDealershipInvitationRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly alert_repository: TypeOrmAlertRepository,
    private readonly newsletter_service: NewsletterService,
    @Inject(CACHE_MANAGER)
    private readonly cache_manager: Cache,
  ) { }

  async createProfile(createProfileDto: CreateProfileDto): Promise<ProfileResponse> {
    return this.create(createProfileDto);
  }

  async create(input: {
    id: string;
    name: string;
    last_name?: string;
    avatar_url?: string;
    image_url?: string;
  }): Promise<ProfileResponse> {
    const email = await this.profile_user_repository.findEmailById(input.id);
    const accepted_invitation = email
      ? await this.dealership_invitation_repository.findAcceptedByEmail(email)
      : null;
    const dealership_member_role = accepted_invitation
      ? this.toDealershipMemberRole(accepted_invitation.role)
      : null;

    await this.profile_repository.save({
      id: input.id,
      name: input.name,
      last_name: input.last_name,
      avatar_url: input.avatar_url,
      image_url: input.image_url,
    });

    if (email) {
      await this.alert_repository.claimByEmail(email, input.id);
      await this.newsletter_service.claimByEmail(email, input.id);
    }

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

    const saved = await this.profile_repository.findOne(input.id);
    if (!saved) {
      throw new ProfileNotFoundException(input.id);
    }
    return mapProfileToResponse(saved);
  }

  async adminCreate(
    input: AdminCreateProfileInput,
  ): Promise<ProfileResponse> {
    const user_exists = await this.profile_user_repository.exists(input.id);
    if (!user_exists) {
      throw new NotFoundException("No se encontró el usuario");
    }

    await this.admin_profile_repository.create({
      id: input.id,
      name: input.name,
      last_name: input.last_name,
      avatar_url: input.avatar_url,
      image_url: input.image_url,
    });

    const saved = await this.admin_profile_repository.findOne(input.id);
    if (!saved) {
      throw new ProfileNotFoundException(input.id);
    }
    return mapProfileToResponse(saved);
  }

  async adminUpdate(
    input: AdminUpdateProfileInput,
  ): Promise<ProfileResponse> {
    const currentProfile = await this.admin_profile_repository.findOne(
      input.id,
    );
    if (!currentProfile) {
      throw new ProfileNotFoundException(input.id);
    }

    const { id, ...patch } = input;
    const updated = await this.admin_profile_repository.update(id, patch);
    if (!updated) {
      throw new ProfileNotFoundException(id);
    }
    return mapProfileToResponse(updated);
  }

  async findAll(
    input: FindAllProfilesInput,
  ): Promise<PaginatedResult<ProfileResponse>> {
    const filter = new ProfileFilter({
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
      name: input.name,
      email: input.email,
    });
    const profiles = await this.profile_repository.findAll(filter);
    return profiles.map((profile) => mapProfileToResponse(profile));
  }

  async findOne(id: string): Promise<ProfileResponse> {
    return this.findOnePrimitives(id);
  }

  async findOnePrimitives(id: string): Promise<ProfileResponse> {
    const profile = await this.profile_repository.findOne(id);
    if (!profile) {
      throw new ProfileNotFoundException(id);
    }
    return mapProfileToResponse(profile);
  }

  async findByEmail(email: string): Promise<ProfileResponse> {
    const profile = await this.profile_repository.findByEmail(email);
    if (!profile) {
      throw new ProfileNotFoundException(email);
    }
    return mapProfileToResponse(profile);
  }

  async updateProfile(
    user_id: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.update(user_id, dto);
  }

  async update(id: string, dto: UpdateMyProfileHttpDto): Promise<ProfileResponse> {
    const profile = await this.profile_repository.findOne(id);
    if (!profile) {
      throw new ProfileNotFoundException(id);
    }

    if (dto.phone && dto.phone !== profile.phone) {
      const phone_exists = await this.profile_repository.findByPhone(dto.phone);
      if (phone_exists) {
        throw new BadRequestException("El teléfono ya está en uso");
      }
    }

    const updated = await this.profile_repository.update(id, dto);
    if (!updated) {
      throw new ProfileNotFoundException(id);
    }

    const reloaded = await this.profile_repository.findOne(id);
    if (!reloaded) {
      throw new ProfileNotFoundException(id);
    }
    await this.cache_manager.del(`me:${id}`);
    return mapProfileToResponse(reloaded);
  }

  async getMyProfile(user_id: string): Promise<ProfileResponse> {
    return this.findOnePrimitives(user_id);
  }

  async updateMyProfile(
    user_id: string,
    dto: UpdateMyProfileHttpDto,
  ): Promise<ProfileResponse> {
    return this.update(user_id, dto);
  }

  async removeProfile(id: string): Promise<void> {
    const profile_exists = await this.profile_repository.exists(id);
    if (!profile_exists) {
      throw new ProfileNotFoundException(id);
    }
    await this.profile_repository.delete(id);
  }

  private toDealershipMemberRole(
    role: string,
  ): PrimitiveDealershipMember["role"] {
    if (
      dealership_member_roles.has(role as PrimitiveDealershipMember["role"])
    ) {
      return role as PrimitiveDealershipMember["role"];
    }

    throw new BadRequestException(
      `La invitación tiene un rol inválido: ${role}`,
    );
  }
}
