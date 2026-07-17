import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthProvider, User } from "@/src/contexts/users/entities/user.entity";

import { ProfileEntity } from "../entities/profile.entity";
import { Profile, PrimitiveUser } from "../types/profile";

const resolve_user_providers = (
  user: User,
): Pick<PrimitiveUser, "providers" | "has_password"> => {
  const has_password = Boolean(user.password);
  const providers: AuthProvider[] = [];

  if (has_password) {
    providers.push("local");
  }

  for (const identity of user.auth_providers ?? []) {
    providers.push(identity.provider);
  }

  return { providers, has_password };
};

const user_to_primitives = (user: User): PrimitiveUser => {
  const identity = resolve_user_providers(user);

  return {
    id: user.id,
    email: user.email,
    providers: identity.providers,
    has_password: identity.has_password,
    last_sign_in: user.last_sign_in,
    is_email_verified: user.is_email_verified,
    two_factor_enabled: user.two_factor_enabled,
    is_suspended: user.is_suspended,
    suspension_reason: user.suspension_reason,
    suspension_end_time: user.suspension_end_time,
    suspended_at: user.suspended_at,
    created_at: user.created_at,
  };
};

export class TypeOrmAdminProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async create(profile: Profile): Promise<void> {
    const p = profile.toPrimitives();
    await this.profileRepository.save({
      id: p.id,
      name: p.name,
      last_name: p.last_name,
    });
  }

  async findOne(id: string): Promise<Profile | null> {
    const profile = await this.profileRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.user", "user")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .addSelect("user.password")
      .where("p.id = :id", { id })
      .getOne();

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
      user: profile.user ? user_to_primitives(profile.user) : undefined,
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
