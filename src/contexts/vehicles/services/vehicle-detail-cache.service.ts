import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";

import type { VehicleDetail } from "../types/vehicle-detail";

type VehicleDetailLoader = () => Promise<VehicleDetail | null>;

@Injectable()
export class VehicleDetailCacheService {
  private readonly logger = new Logger(VehicleDetailCacheService.name);
  private readonly cacheTtl = 5 * 60 * 1000;
  private readonly inFlight = new Map<string, Promise<VehicleDetail | null>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getOrLoad(
    vehicleId: string,
    loader: VehicleDetailLoader,
  ): Promise<VehicleDetail | null> {
    const cacheKey = this.buildKey(vehicleId);
    const cachedDetail = await this.cacheManager.get<VehicleDetail>(cacheKey);
    if (cachedDetail) {
      return cachedDetail;
    }

    const pendingDetail = this.inFlight.get(cacheKey);
    if (pendingDetail) {
      return pendingDetail;
    }

    const loadPromise: Promise<VehicleDetail | null> = loader()
      .then(async (detail) => {
        const isStillCurrent = this.inFlight.get(cacheKey) === loadPromise;
        if (detail && isStillCurrent) {
          await this.cacheManager.set(cacheKey, detail, this.cacheTtl);
        }
        return detail;
      })
      .finally(() => {
        if (this.inFlight.get(cacheKey) === loadPromise) {
          this.inFlight.delete(cacheKey);
        }
      });

    this.inFlight.set(cacheKey, loadPromise);
    return loadPromise;
  }

  async invalidate(vehicleId: string): Promise<void> {
    const cacheKey = this.buildKey(vehicleId);
    this.inFlight.delete(cacheKey);
    await this.cacheManager.del(cacheKey);
  }

  /** Best-effort: never throws so it can't break the write that triggered it. */
  async refresh(vehicleId: string, loader: VehicleDetailLoader): Promise<void> {
    try {
      await this.invalidate(vehicleId);
      await this.getOrLoad(vehicleId, loader);
    } catch (error) {
      this.logger.error(
        `Failed to refresh detail cache for vehicle ${vehicleId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private buildKey(vehicleId: string): string {
    return `find-vehicle:${vehicleId}`;
  }
}
