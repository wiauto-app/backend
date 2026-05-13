import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Profile, PrimitiveProfile, PrimitiveProfileRole } from "../../domain/entities/profile";
import { ProfileRepository } from "../../domain/repositories/profile.repository";
import { ProfileEntity } from "../persistence/profile.entity";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { ProfileFilter } from "../../domain/filters/profile.filter";

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

function entity_to_primitives(entity: ProfileEntity): PrimitiveProfile {
  return {
    id: entity.id,
    name: entity.name,
    last_name: entity.last_name,
    avatar_url: entity.avatar_url,
    image_url: entity.image_url,
    role_id: entity.role?.id ?? null,
    role: role_to_primitives(entity.role),
  };
}

@Injectable()
export class TypeOrmProfileRepository implements ProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profile_entity_repository: Repository<ProfileEntity>,
  ) { }

  async save(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    const entity = new ProfileEntity();
    entity.id = p.id;
    entity.name = p.name ?? undefined;
    entity.last_name = p.last_name ?? undefined;
    entity.avatar_url = p.avatar_url ?? "";
    entity.image_url = p.image_url ?? "";
    entity.role = p.role_id ? ({ id: p.role_id } as Roles) : null;

    await this.profile_entity_repository.save(entity);
  }

  async exists(id: string): Promise<boolean> {
    return this.profile_entity_repository.exists({ where: { id } });
  }


  async findAll(filter: ProfileFilter): Promise<PaginatedResult<Profile>> {
    console.log(filter);
    const skip = getSkip(filter.page, filter.limit);
    const qb = this.profile_entity_repository.createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
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

    const [rows, total] = await qb.getManyAndCount();
    return new PaginatedResult(rows.map((row) => Profile.fromPrimitives(entity_to_primitives(row))), total, filter.page, filter.limit);
  }

  async findOne(id: string): Promise<Profile | null> {
    const entity = await this.profile_entity_repository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!entity) {
      return null;
    }

    return Profile.fromPrimitives(entity_to_primitives(entity));
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const entity = await this.profile_entity_repository.findOne({
      where: { user: { email } },
      relations: { role: true },
    });

    if (!entity) {
      return null;
    }

    return Profile.fromPrimitives(entity_to_primitives(entity));
  }

  async update(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    const preloaded = await this.profile_entity_repository.preload({
      id: p.id,
      name: p.name ?? undefined,
      last_name: p.last_name ?? undefined,
      avatar_url: p.avatar_url ?? "",
      image_url: p.image_url ?? "",
      role: p.role_id ? ({ id: p.role_id } as Roles) : null,
    });

    if (!preloaded) {
      return;
    }

    await this.profile_entity_repository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.profile_entity_repository.delete(id);
  }
}
