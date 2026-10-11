import "reflect-metadata";

import { describe, expect, it, vi } from "vitest";

// Evita cargar el grafo completo de VehicleService/TypeORM en el test unitario.
vi.mock("@/src/contexts/vehicles/services/vehicle.service", () => ({
  VehicleService: vi.fn(),
}));
vi.mock(
  "@/src/contexts/vehicles/search-history/services/vehicle-search-history.service",
  () => ({ VehicleSearchHistoryService: vi.fn() }),
);

import { FindAllVehiclesController } from "@/src/contexts/vehicles/api/v1/find-all-vehicles/find-all-vehicles.controller";
import type { FindAllVehiclesHttpDto } from "@/src/contexts/vehicles/api/v1/find-all-vehicles/find-all-vehicles.http-dto";

const USER_ID = "3f2b8c1e-4d5a-4b6c-9e7f-1a2b3c4d5e6f";

const createController = () => {
  const vehicleService = {
    findAll: vi.fn().mockResolvedValue({ data: [], total: 7, page: 1, limit: 10 }),
  };
  const searchHistoryService = { recordInBackground: vi.fn() };
  const controller = new FindAllVehiclesController(
    vehicleService as never,
    searchHistoryService as never,
  );
  return { controller, searchHistoryService };
};

const dto = { page: 1, makes_slugs: ["bmw"] } as unknown as FindAllVehiclesHttpDto;

const request = (headers: Record<string, string> = {}) =>
  ({ url: "/api/v1/vehicles?makes_slugs=bmw", headers }) as never;

describe("GET /v1/vehicles — registro opt-in del historial", () => {
  it("registra con usuario y x-record-search: 1", async () => {
    const { controller, searchHistoryService } = createController();

    await controller.run(dto, USER_ID, request({ "x-record-search": "1" }));

    expect(searchHistoryService.recordInBackground).toHaveBeenCalledWith({
      user_id: USER_ID,
      params: dto,
      results_count: 7,
    });
  });

  it("no registra sin el header", async () => {
    const { controller, searchHistoryService } = createController();

    await controller.run(dto, USER_ID, request());

    expect(searchHistoryService.recordInBackground).not.toHaveBeenCalled();
  });

  it("no registra sin usuario aunque llegue el header", async () => {
    const { controller, searchHistoryService } = createController();

    await controller.run(dto, undefined, request({ "x-record-search": "true" }));

    expect(searchHistoryService.recordInBackground).not.toHaveBeenCalled();
  });
});
