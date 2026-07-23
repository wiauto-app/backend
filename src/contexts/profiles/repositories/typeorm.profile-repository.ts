import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProfileEntity } from "../entities/profile.entity";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { ProfileFilter } from "../types/profile.filter";

export interface SaveProfileInput {
  id: string;
  name: string;
  last_name?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role_id?: string | null;
  phone_code?: string | null;
  phone?: string | null;
  dni?: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  last_name?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role_id?: string | null;
  phone_code?: string | null;
  phone?: string | null;
  dni?: string | null;
}

@Injectable()
export class TypeOrmProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async save(input: SaveProfileInput): Promise<ProfileEntity> {
    const entity = this.profileRepository.create({
      id: input.id,
      name: input.name,
      last_name: input.last_name ?? undefined,
      avatar_url: input.avatar_url ?? "",
      image_url: input.image_url ?? "",
      role: input.role_id ? ({ id: input.role_id } as Roles) : null,
      role_id: input.role_id ?? undefined,
      phone_code: input.phone_code ?? null,
      phone: input.phone ?? null,
      dni: input.dni ?? null,
    });

    return this.profileRepository.save(entity);
  }

  async exists(id: string): Promise<boolean> {
    return this.profileRepository.exists({ where: { id } });
  }

  async findAll(
    filter: ProfileFilter,
  ): Promise<PaginatedResult<ProfileEntity>> {
    const skip = getSkip(filter.page, filter.limit);
    const qb = this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .skip(skip)
      .take(filter.limit);

    if (filter.query) {
      qb.andWhere("p.name ILIKE :query OR p.last_name ILIKE :query", {
        query: `%${filter.query}%`,
      });
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
    return new PaginatedResult(rows, total, filter.page, filter.limit);
  }

  async findOne(id: string): Promise<ProfileEntity | null> {
    return this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .where("p.id = :id", { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<ProfileEntity | null> {
    return this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  async findByIds(ids: string[]): Promise<ProfileEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.role", "role")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .where("p.id IN (:...ids)", { ids })
      .getMany();
  }

  async update(id: string, input: UpdateProfileInput): Promise<ProfileEntity | null> {
    const preloaded = await this.profileRepository.preload({
      id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.last_name !== undefined
        ? { last_name: input.last_name ?? undefined }
        : {}),
      ...(input.avatar_url !== undefined
        ? { avatar_url: input.avatar_url ?? "" }
        : {}),
      ...(input.image_url !== undefined
        ? { image_url: input.image_url ?? "" }
        : {}),
      ...(input.role_id !== undefined ? { role_id: input.role_id ?? undefined } : {}),
      ...(input.phone_code !== undefined
        ? { phone_code: input.phone_code }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.dni !== undefined ? { dni: input.dni } : {}),
    });

    if (!preloaded) {
      return null;
    }

    return this.profileRepository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.profileRepository.delete(id);
  }
}
