import "reflect-metadata";

import { describe, expect, it, vi } from "vitest";

import { VehicleSearchHistoryNotFoundException } from "@/src/contexts/vehicles/search-history/exceptions/vehicle-search-history-not-found.exception";
import { VehicleSearchHistoryService } from "@/src/contexts/vehicles/search-history/services/vehicle-search-history.service";

const USER_ID = "3f2b8c1e-4d5a-4b6c-9e7f-1a2b3c4d5e6f";

const lookupRepository = (rows: unknown[] = []) => ({
  find: vi.fn().mockResolvedValue(rows),
  findOne: vi.fn().mockResolvedValue(rows[0] ?? null),
});

const createService = (options: { inserted?: boolean } = {}) => {
  const historyRepository = {
    query: vi.fn().mockResolvedValue([{ inserted: options.inserted ?? true }]),
    find: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const makeRepository = lookupRepository([{ slug: "bmw", name: "BMW" }]);
  const modelRepository = lookupRepository([
    { slug: "serie-3", name: "Serie 3" },
  ]);

  const service = new VehicleSearchHistoryService(
    historyRepository as never,
    lookupRepository() as never,
    makeRepository as never,
    modelRepository as never,
    lookupRepository() as never,
    lookupRepository() as never,
    lookupRepository() as never,
    lookupRepository() as never,
    lookupRepository() as never,
  );

  return { service, historyRepository, makeRepository };
};

describe("VehicleSearchHistoryService.record", () => {
  it("hace upsert con la búsqueda normalizada y poda al insertar", async () => {
    const { service, historyRepository } = createService({ inserted: true });

    await service.record({
      user_id: USER_ID,
      params: {
        page: 1,
        makes_slugs: ["bmw"],
        models_slugs: ["serie-3"],
        order_by: "price",
      } as never,
      results_count: 42,
    });

    expect(historyRepository.query).toHaveBeenCalledTimes(2);
    const [sql, params] = historyRepository.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("ON CONFLICT (\"user_id\", \"query_hash\")");
    expect(params[0]).toBe(USER_ID);
    expect(JSON.parse(params[1] as string)).toEqual({
      makes_slugs: ["bmw"],
      models_slugs: ["serie-3"],
    });
    expect(params[3]).toBe("BMW Serie 3");
    expect(params[4]).toBe(2);
    expect(params[5]).toBe(42);
    expect(historyRepository.query.mock.calls[1][0]).toContain("OFFSET $2");
  });

  it("no poda cuando solo actualiza una búsqueda existente", async () => {
    const { service, historyRepository } = createService({ inserted: false });

    await service.record({
      user_id: USER_ID,
      params: { page: 1, makes_slugs: ["bmw"] } as never,
      results_count: 1,
    });

    expect(historyRepository.query).toHaveBeenCalledTimes(1);
  });

  it("ignora páginas siguientes y búsquedas sin filtros", async () => {
    const { service, historyRepository } = createService();

    await service.record({
      user_id: USER_ID,
      params: { page: 2, makes_slugs: ["bmw"] } as never,
      results_count: 1,
    });
    await service.record({
      user_id: USER_ID,
      params: { page: 1, order_by: "price" } as never,
      results_count: 1,
    });

    expect(historyRepository.query).not.toHaveBeenCalled();
  });

  it("recordInBackground nunca propaga errores", async () => {
    const { service, historyRepository } = createService();
    historyRepository.query.mockRejectedValue(new Error("db down"));

    expect(() =>
      { service.recordInBackground({
        user_id: USER_ID,
        params: { page: 1, makes_slugs: ["bmw"] } as never,
        results_count: 1,
      }); },
    ).not.toThrow();

    await new Promise((resolve) => setImmediate(resolve));
    expect(historyRepository.query).toHaveBeenCalled();
  });
});

describe("VehicleSearchHistoryService.findAll", () => {
  it("limita a 50 y ordena por last_searched_at desc", async () => {
    const { service, historyRepository } = createService();

    await service.findAll({ user_id: USER_ID, limit: 500 });

    expect(historyRepository.find).toHaveBeenCalledWith({
      where: { user_id: USER_ID },
      order: { last_searched_at: "DESC", created_at: "DESC" },
      take: 50,
    });
  });
});

describe("VehicleSearchHistoryService.remove", () => {
  it("solo borra filas del usuario y lanza 404 si no existe", async () => {
    const { service, historyRepository } = createService();
    historyRepository.delete.mockResolvedValueOnce({ affected: 0 });

    await expect(
      service.remove({ user_id: USER_ID, id: "other-id" }),
    ).rejects.toBeInstanceOf(VehicleSearchHistoryNotFoundException);
    expect(historyRepository.delete).toHaveBeenCalledWith({
      id: "other-id",
      user_id: USER_ID,
    });
  });
});
