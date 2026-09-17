import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "@nestjs/cache-manager";

import type { MeResponseDto } from "../dto/me-response.dto";

const ME_SESSION_CACHE_KEY_PREFIX = "me:";
/** 5 minutos (cache-manager TTL en milisegundos). */
const ME_SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class MeSessionCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache_manager: Cache,
  ) {}

  private buildKey(user_id: string): string {
    return `${ME_SESSION_CACHE_KEY_PREFIX}${user_id}`;
  }

  async get(user_id: string): Promise<MeResponseDto | undefined> {
    return this.cache_manager.get<MeResponseDto>(this.buildKey(user_id));
  }

  async set(
    user_id: string,
    value: MeResponseDto,
    ttl_ms: number = ME_SESSION_CACHE_TTL_MS,
  ): Promise<void> {
    await this.cache_manager.set(this.buildKey(user_id), value, ttl_ms);
  }

  async invalidate(user_id: string): Promise<void> {
    await this.cache_manager.del(this.buildKey(user_id));
  }

  /**
   * En WiAuto el profile.id es el mismo UUID que user.id (PK compartida).
   * Los webhooks de Stripe suelen resolver profile_id.
   */
  async invalidateByProfileId(profile_id: string): Promise<void> {
    await this.invalidate(profile_id);
  }
}
