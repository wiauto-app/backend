import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { TypeOrmAlertRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-repository";
import { NewsletterService } from "@/src/contexts/newsletter/services/newsletter.service";
import { MeSessionCacheService } from "@/src/contexts/auth/services/me-session-cache.service";
import { VehiclePublisherSyncService } from "@/src/contexts/vehicles/services/vehicle-publisher-sync.service";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";

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
import { UpdateMyProfileHttpDto } from "../api/auth-me/update-my-profile/update-my-profile.http-dto";
import { ProfileEntity } from "../entities/profile.entity";

const dealership_member_roles = new Set<DealershipMembersEntity["role"]>([
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
  last_name?: string;
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

/**
 * Devuelve la object key del avatar solo si es un archivo propio del perfil
 * en R2 (`profile-images/avatars/<profile_id>/...`). URLs externas (p. ej.
 * avatar de Google) u otras rutas devuelven `null` y nunca se borran.
 */
export const resolveOwnedAvatarObjectKey = (
  profile_id: string,
  avatar_url: string | null | undefined,
): string | null => {
  const key = avatar_url?.trim().replace(/^\/+/, "");
  if (!key || /^[a-z][a-z0-9+.-]*:/i.test(key) || key.includes("..")) {
    return null;
  }
  const owned_prefix = `${STORAGE_DIRECTORIES.PROFILE_IMAGES}/avatars/${profile_id}/`;
  return key.startsWith(owned_prefix) ? key : null;
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly admin_profile_repository: TypeOrmAdminProfileRepository,
    private readonly dealership_invitation_repository: TypeOrmDealershipInvitationRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly alert_repository: TypeOrmAlertRepository,
    private readonly newsletter_service: NewsletterService,
    private readonly me_session_cache_service: MeSessionCacheService,
    private readonly vehicle_publisher_sync_service: VehiclePublisherSyncService,
    private readonly object_storage_service: ObjectStorageService,
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
    phone_code?: string;
    phone?: string;
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
      phone_code: input.phone_code,
      phone: input.phone,
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
        await this.dealership_member_repository.save({
          dealership_id: accepted_invitation.dealership_id,
          profile_id: input.id,
          role: dealership_member_role,
        });
        await this.vehicle_publisher_sync_service.syncForProfile(input.id);
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
      last_name: input.last_name,
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

  async findByEmail(email: string): Promise<ProfileEntity | null> {
    const profile = await this.profile_repository.findByEmail(email);
    return profile;
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
    await this.me_session_cache_service.invalidateByProfileId(id);
    await this.removeReplacedAvatar(id, profile.avatar_url, reloaded.avatar_url);
    return mapProfileToResponse(reloaded);
  }

  /**
   * Borra de R2 el avatar anterior cuando se eliminó o se reemplazó.
   * Best-effort: el perfil ya quedó actualizado en DB, un fallo de storage
   * solo deja un objeto huérfano y se registra en el log.
   */
  private async removeReplacedAvatar(
    profile_id: string,
    previous_avatar_url: string | null | undefined,
    current_avatar_url: string | null | undefined,
  ): Promise<void> {
    if (!previous_avatar_url || previous_avatar_url === current_avatar_url) {
      return;
    }
    const object_key = resolveOwnedAvatarObjectKey(profile_id, previous_avatar_url);
    if (!object_key) {
      return;
    }
    try {
      await this.object_storage_service.deleteObjectByKey(object_key);
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar el avatar anterior ${object_key} del perfil ${profile_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
  ): DealershipMembersEntity["role"] {
    if (
      dealership_member_roles.has(role as DealershipMembersEntity["role"])
    ) {
      return role as DealershipMembersEntity["role"];
    }

    throw new BadRequestException(
      `La invitación tiene un rol inválido: ${role}`,
    );
  }
}
