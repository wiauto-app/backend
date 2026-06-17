import { AdminProfileRepository } from "../../domain/repositories/admin-profile.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProfileEntity } from "../persistence/profile.entity";
import { Profile } from "../../domain/entities/profile";


export class TypeOrmAdminProfileRepository implements AdminProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) { }

  async create(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    await this.profileRepository.save({
      id: p.id,
      name: p.name,
      last_name: p.last_name,
    });
  }

  async findOne(id: string): Promise<Profile | null> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      return null;
    }
    return Profile.fromPrimitives({
      id: profile.id,
      name: profile.name,
      last_name: profile.last_name ?? undefined,
      dni: profile.dni ?? undefined,
      phone: profile.phone ?? undefined,
      phone_code: profile.phone_code ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      image_url: profile.image_url ?? undefined,
      role_id: profile.role_id,
      user: profile.user ?? undefined,
    });
  }

  async update(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    await this.profileRepository.save({
      id: p.id, 
      name: p.name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      image_url: p.image_url,
      role_id: p.role_id,
    });
  }
}