import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "@nestjs/cache-manager";

import type { VehicleListFavoritesSnapshot } from "../types/vehicle-list-favorites-snapshot";

const FAVORITES_CACHE_KEY_PREFIX = "favorites:";
/** 15 minutos (cache-manager TTL en milisegundos). */
const FAVORITES_CACHE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class VehicleListFavoritesCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache_manager: Cache,
  ) {}

  private buildKey(profile_id: string): string {
    return `${FAVORITES_CACHE_KEY_PREFIX}${profile_id}`;
  }

  async get(
    profile_id: string,
  ): Promise<VehicleListFavoritesSnapshot | undefined> {
    return this.cache_manager.get<VehicleListFavoritesSnapshot>(
      this.buildKey(profile_id),
    );
  }

  async set(
    profile_id: string,
    value: VehicleListFavoritesSnapshot,
    ttl_ms: number = FAVORITES_CACHE_TTL_MS,
  ): Promise<void> {
    await this.cache_manager.set(this.buildKey(profile_id), value, ttl_ms);
  }

  async invalidate(profile_id: string): Promise<void> {
    await this.cache_manager.del(this.buildKey(profile_id));
  }
}
