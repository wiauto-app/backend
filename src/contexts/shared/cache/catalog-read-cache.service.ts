import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { createHash } from "node:crypto";

import { MONTH } from "@/src/common/envs";
import { stableStringify } from "./stable-cache-key";

@Injectable()
export class CatalogReadCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache_manager: Cache,
  ) {}

  async getOrSet<T>(
    namespace: string,
    params: Record<string, unknown>,
    factory: () => Promise<T>,
    ttl_ms: number = MONTH,
  ): Promise<T> {
    const key = this.buildKey(namespace, params);
    const cached = await this.cache_manager.get<T>(key);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.cache_manager.set(key, value, ttl_ms);
    return value;
  }

  private buildKey(namespace: string, params: Record<string, unknown>): string {
    const digest = createHash("sha256")
      .update(stableStringify(params))
      .digest("hex")
      .slice(0, 40);

    return `catalog-read:${namespace}:${digest}`;
  }
}
