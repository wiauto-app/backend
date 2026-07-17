import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthProvider, User } from "../entities/user.entity";
import {
  OAuthProvider,
  UserAuthProvider,
} from "../entities/user-auth-provider.entity";

export interface AuthIdentitySummary {
  providers: AuthProvider[];
  has_password: boolean;
}

@Injectable()
export class UserAuthProviderService {
  constructor(
    @InjectRepository(UserAuthProvider)
    private readonly userAuthProviderRepository: Repository<UserAuthProvider>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByProvider(
    provider: OAuthProvider,
    provider_id: string,
  ): Promise<User | null> {
    const identity = await this.userAuthProviderRepository.findOne({
      where: { provider, provider_id },
      relations: ["user", "user.profile", "user.profile.role"],
    });

    return identity?.user ?? null;
  }

  async linkProvider(
    user_id: string,
    provider: OAuthProvider,
    provider_id: string,
  ): Promise<UserAuthProvider> {
    const existingByProviderId = await this.userAuthProviderRepository.findOne({
      where: { provider, provider_id },
    });
    if (existingByProviderId) {
      return existingByProviderId;
    }

    const existingByUserProvider =
      await this.userAuthProviderRepository.findOne({
        where: { user_id, provider },
      });
    if (existingByUserProvider) {
      if (existingByUserProvider.provider_id === provider_id) {
        return existingByUserProvider;
      }

      const updated = await this.userAuthProviderRepository.preload({
        id: existingByUserProvider.id,
        provider_id,
      });
      if (!updated) {
        throw new NotFoundException("No se encontró la identidad OAuth");
      }
      return this.userAuthProviderRepository.save(updated);
    }

    const created = this.userAuthProviderRepository.create({
      user_id,
      provider,
      provider_id,
    });
    return this.userAuthProviderRepository.save(created);
  }

  async listProviders(userId: string): Promise<AuthProvider[]> {
    const summary = await this.getAuthIdentitySummary(userId);
    return summary.providers;
  }

  async getAuthIdentitySummary(userId: string): Promise<AuthIdentitySummary> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.auth_providers", "auth_providers")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException("No se encontró el usuario");
    }

    const has_password = Boolean(user.password);
    const providers: AuthProvider[] = [];

    if (has_password) {
      providers.push("local");
    }

    for (const identity of user.auth_providers ?? []) {
      providers.push(identity.provider);
    }

    return { providers, has_password };
  }
}
