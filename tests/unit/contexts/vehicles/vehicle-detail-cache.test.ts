import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { VehicleDetailCacheService } from "@/src/contexts/vehicles/services/vehicle-detail-cache.service";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import type { VehicleDetail } from "@/src/contexts/vehicles/types/vehicle-detail";

const vehicleId = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const ownerId = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const visitorId = "5b0f8c3e-2a4d-4f6b-9c1e-7d8a9b0c1d2e";

const VEHICLE_SERVICE_ARGS = 27;
const DETAIL_CACHE_INDEX = 26;

const buildDetail = (phone: string | null): VehicleDetail =>
  ({ id: vehicleId, profile_id: ownerId, phone }) as unknown as VehicleDetail;

const createCache = () => {
  const store = new Map<string, unknown>();
  const cacheManager = {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
  const detailCache = new VehicleDetailCacheService(cacheManager as never);
  return { cacheManager, detailCache };
};

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("VehicleDetailCacheService", () => {
  it("concurrent requests for the same vehicle run the loader once", async () => {
    const { detailCache, cacheManager } = createCache();
    const deferred = createDeferred<VehicleDetail | null>();
    const loader = vi.fn(() => deferred.promise);

    const requests = Array.from({ length: 5 }, () =>
      detailCache.getOrLoad(vehicleId, loader),
    );
    await flushMicrotasks();
    deferred.resolve(buildDetail(null));
    const results = await Promise.all(requests);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);
    expect(results.every((result) => result === results[0])).toBe(true);
  });

  it("does not cache a missing vehicle", async () => {
    const { detailCache, cacheManager } = createCache();

    await detailCache.getOrLoad(vehicleId, async () => null);

    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it("an invalidation during a load prevents caching the stale result", async () => {
    const { detailCache, cacheManager } = createCache();
    const deferred = createDeferred<VehicleDetail | null>();

    const staleRequest = detailCache.getOrLoad(vehicleId, () => deferred.promise);
    await flushMicrotasks();
    await detailCache.invalidate(vehicleId);
    deferred.resolve(buildDetail(null));
    await staleRequest;

    expect(cacheManager.set).not.toHaveBeenCalled();
  });
});

describe("VehicleDetailCacheService.refresh", () => {
  it("replaces a stale entry with freshly loaded data", async () => {
    const { detailCache } = createCache();
    await detailCache.getOrLoad(vehicleId, async () => buildDetail("old"));

    await detailCache.refresh(vehicleId, async () => buildDetail("new"));
    const loader = vi.fn(async () => buildDetail("unused"));
    const cached = await detailCache.getOrLoad(vehicleId, loader);

    expect(cached?.phone).toBe("new");
    expect(loader).not.toHaveBeenCalled();
  });

  it("never throws when the loader fails", async () => {
    const { detailCache } = createCache();
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);

    await expect(
      detailCache.refresh(vehicleId, async () => {
        throw new Error("db down");
      }),
    ).resolves.toBeUndefined();
    expect(loggerErrorSpy).toHaveBeenCalledOnce();
    loggerErrorSpy.mockRestore();
  });
});

describe("VehicleService.findOne with detail cache", () => {
  const createService = () => {
    const { detailCache } = createCache();
    const vehicleRepository = {
      findOne: vi.fn(async (_id: string, profileId?: string) =>
        buildDetail(profileId === ownerId ? "600000000" : null),
      ),
    };
    const args: unknown[] = Array.from({ length: VEHICLE_SERVICE_ARGS }, () => ({}));
    args[0] = vehicleRepository;
    args[DETAIL_CACHE_INDEX] = detailCache;
    const service = new (VehicleService as unknown as new (
      ...params: unknown[]
    ) => VehicleService)(...args);
    return { service, vehicleRepository };
  };

  it("serves visitors from the cache without the phone", async () => {
    const { service, vehicleRepository } = createService();

    await service.findOne({ id: vehicleId }, visitorId);
    const second = await service.findOne({ id: vehicleId });

    expect(vehicleRepository.findOne).toHaveBeenCalledTimes(1);
    expect(second.phone).toBeNull();
  });

  it("returns a fresh detail with the phone to the owner", async () => {
    const { service, vehicleRepository } = createService();

    const result = await service.findOne({ id: vehicleId }, ownerId);

    expect(result.phone).toBe("600000000");
    expect(vehicleRepository.findOne).toHaveBeenLastCalledWith(vehicleId, ownerId);
  });
});
