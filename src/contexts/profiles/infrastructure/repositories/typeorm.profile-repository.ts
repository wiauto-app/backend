import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Profile, PrimitiveProfile, PrimitiveProfileRole } from "../../domain/entities/profile";
import { ProfileRepository } from "../../domain/repositories/profile.repository";
import { ProfileEntity } from "../persistence/profile.entity";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { ProfileFilter } from "../../domain/filters/profile.filter";
import { User } from "@/src/contexts/users/entities/user.entity";

function role_to_primitives(role: ProfileEntity["role"]): PrimitiveProfileRole | null {
  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    is_admin: role.is_admin,
    is_developer: role.is_developer,
    is_default: role.is_default,
  };
}


function user_to_primitives(user: User) {
  return {
    id: user.id,
    email: user.email,
    last_sign_in: user.last_sign_in,
    provider: user.provider,
    is_email_verified: user.is_email_verified,
    two_factor_enabled: user.two_factor_enabled,
    is_suspended: user.is_suspended,
    suspension_reason: user.suspension_reason,
    suspension_end_time: user.suspension_end_time,
    suspended_at: user.suspended_at,
    created_at: user.created_at,
  };
}
function entity_to_primitives(entity: ProfileEntity): PrimitiveProfile {
  return {
    id: entity.id,
    name: entity.name,
    last_name: entity.last_name,
    avatar_url: entity.avatar_url,
    image_url: entity.image_url,
    role_id: entity.role?.id ?? "",
    role: role_to_primitives(entity.role),
    user: user_to_primitives(entity.user),
  };
}

@Injectable()
export class TypeOrmProfileRepository implements ProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) { }

  async save(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    const entity = new ProfileEntity();
    entity.id = p.id;
    entity.name = p.name;
    entity.last_name = p.last_name ?? undefined;
    entity.avatar_url = p.avatar_url ?? "";
    entity.image_url = p.image_url ?? "";
    entity.role = p.role_id ? ({ id: p.role_id } as Roles) : null;

    await this.profileRepository.save(entity);
  }

  async exists(id: string): Promise<boolean> {
    return this.profileRepository.exists({ where: { id } });
  }


  async findAll(filter: ProfileFilter): Promise<PaginatedResult<Profile>> {
    const skip = getSkip(filter.page, filter.limit);
    const qb = this.profileRepository.createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
      .leftJoinAndSelect("p.user", "user")
      .skip(skip)
      .take(filter.limit);

    if (filter.query) {
      qb.andWhere("p.name ILIKE :query OR p.last_name ILIKE :query", { query: `%${filter.query}%` });
    }
    if (filter.order_by) {
      qb.orderBy(`p.${filter.order_by}`, filter.order_direction);
    }

    if (filter.role_id) {
      qb.andWhere("p.role_id = :role_id", { role_id: filter.role_id });
    }

    if (filter.name) {
      qb.andWhere("p.name ILIKE :name", { name: `%${filter.name}%` });
    }

    if (filter.email) {
      qb.andWhere("user.email ILIKE :email", { email: `%${filter.email}%` });
    }

    const [rows, total] = await qb.getManyAndCount();
    return new PaginatedResult(rows.map((row) => Profile.fromPrimitives(entity_to_primitives(row))), total, filter.page, filter.limit);
  }

  async findOne(id: string): Promise<Profile | null> {
    const entity = await this.profileRepository.findOne({
      where: { id },
      relations: { role: true, user: true },
    });

    if (!entity) {
      return null;
    }

    return Profile.fromPrimitives({
      id: entity.id,
      name: entity.name,
      last_name: entity.last_name ?? undefined,
      avatar_url: entity.avatar_url ,
      image_url: entity.image_url,
      role_id: entity.role?.id ?? "",
      role: entity.role,
      user: entity.user,
    });
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const entity = await this.profileRepository.findOne({
      where: { user: { email } },
      relations: { role: true, user: true },
    });

    if (!entity) {
      return null;
    }
    const prifile = Profile.fromPrimitives(entity_to_primitives(entity));
    return prifile;
  }

  async findByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.profileRepository.find({
      where: { id: In(ids) },
      relations: { role: true, user: true },
    });

    return rows.map((row) => Profile.fromPrimitives(entity_to_primitives(row)));
  }

  async update(id: string, profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    const preloaded = await this.profileRepository.preload({
      id: id,
      name: p.name,
      last_name: p.last_name ?? undefined,
      avatar_url: p.avatar_url ?? "",
      image_url: p.image_url ?? "",
      role_id: p.role_id,
      phone_code: p.phone_code ?? undefined,
      phone: p.phone ?? undefined,
      dni: p.dni ?? undefined,
    });

    if (!preloaded) {
      return;
    }

    await this.profileRepository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.profileRepository.delete(id);
  }
}
