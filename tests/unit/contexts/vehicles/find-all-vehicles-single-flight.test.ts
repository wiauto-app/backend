import "reflect-metadata";
import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { FindAllVehiclesHttpDto } from "@/src/contexts/vehicles/api/v1/find-all-vehicles/find-all-vehicles.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";

const CONSTRUCTOR_ARGS = 27;
const CACHE_MANAGER_INDEX = 25;

const pageResult = { data: [], total: 0, page: 1, limit: 20 };

const createService = () => {
  const cacheStore = new Map<string, unknown>();
  const cacheManager = {
    get: vi.fn(async (key: string) => cacheStore.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      cacheStore.set(key, value);
    }),
  };

  let resolveQuery: (value: typeof pageResult) => void = () => {};
  let rejectQuery: (error: Error) => void = () => {};
  const vehicleRepository = {
    findAll: vi.fn(
      () =>
        new Promise<typeof pageResult>((resolve, reject) => {
          resolveQuery = resolve;
          rejectQuery = reject;
        }),
    ),
  };

  const args: unknown[] = Array.from({ length: CONSTRUCTOR_ARGS }, () => ({}));
  args[0] = vehicleRepository;
  args[CACHE_MANAGER_INDEX] = cacheManager;
  const service = new (VehicleService as unknown as new (
    ...params: unknown[]
  ) => VehicleService)(...args);

  return {
    service,
    cacheManager,
    vehicleRepository,
    resolveQuery: (value = pageResult) => resolveQuery(value),
    rejectQuery: (error: Error) => rejectQuery(error),
  };
};

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("VehicleService.findAll single-flight", () => {
  it("concurrent requests with the same key hit the database once", async () => {
    const { service, vehicleRepository, cacheManager, resolveQuery } =
      createService();
    const dto = new FindAllVehiclesHttpDto();

    const requests = Array.from({ length: 5 }, () =>
      service.findAll(dto, undefined, "/api/v1/vehicles?page=1"),
    );
    await flushMicrotasks();
    resolveQuery();
    const results = await Promise.all(requests);

    expect(vehicleRepository.findAll).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);
    expect(results.every((result) => result === results[0])).toBe(true);
  });

  it("different keys query the database independently", async () => {
    const { service, vehicleRepository } = createService();
    const dto = new FindAllVehiclesHttpDto();

    void service.findAll(dto, undefined, "/api/v1/vehicles?page=1");
    void service.findAll(dto, undefined, "/api/v1/vehicles?page=2");
    await flushMicrotasks();

    expect(vehicleRepository.findAll).toHaveBeenCalledTimes(2);
  });

  it("releases the key after a failure so the next request retries", async () => {
    const { service, vehicleRepository, rejectQuery, resolveQuery } =
      createService();
    const dto = new FindAllVehiclesHttpDto();
    const url = "/api/v1/vehicles?page=1";

    const failing = service.findAll(dto, undefined, url);
    await flushMicrotasks();
    rejectQuery(new Error("db down"));
    await expect(failing).rejects.toThrow("db down");

    const retry = service.findAll(dto, undefined, url);
    await flushMicrotasks();
    resolveQuery();
    await expect(retry).resolves.toEqual(pageResult);
    expect(vehicleRepository.findAll).toHaveBeenCalledTimes(2);
  });
});
