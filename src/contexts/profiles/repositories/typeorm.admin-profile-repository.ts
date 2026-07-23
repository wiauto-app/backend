import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProfileEntity } from "../entities/profile.entity";
import type { SaveProfileInput, UpdateProfileInput } from "./typeorm.profile-repository";

export class TypeOrmAdminProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async create(input: SaveProfileInput): Promise<ProfileEntity> {
    return this.profileRepository.save({
      id: input.id,
      name: input.name,
      last_name: input.last_name ?? undefined,
      avatar_url: input.avatar_url ?? undefined,
      image_url: input.image_url ?? undefined,
      role_id: input.role_id ?? undefined,
    });
  }

  async findOne(id: string): Promise<ProfileEntity | null> {
    return this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .where("p.id = :id", { id })
      .getOne();
  }

  async update(id: string, input: UpdateProfileInput): Promise<ProfileEntity | null> {
    const preloaded = await this.profileRepository.preload({
      id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.last_name !== undefined
        ? { last_name: input.last_name ?? undefined }
        : {}),
      ...(input.avatar_url !== undefined
        ? { avatar_url: input.avatar_url ?? undefined }
        : {}),
      ...(input.image_url !== undefined
        ? { image_url: input.image_url ?? undefined }
        : {}),
      ...(input.role_id !== undefined ? { role_id: input.role_id ?? undefined } : {}),
    });

    if (!preloaded) {
      return null;
    }

    return this.profileRepository.save(preloaded);
  }
}
