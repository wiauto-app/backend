import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { AdminFindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-find-all-vehicles-use-case/admin-find-all-vehicles.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import type { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import type { AdminVehicleListItem } from "@/src/contexts/vehicles/domain/read-models/vehicle-list-item";

describe("AdminFindAllVehiclesUseCase", () => {
  let useCase: AdminFindAllVehiclesUseCase;
  let vehicleRepository: Mock<VehicleRepository>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    useCase = new AdminFindAllVehiclesUseCase(vehicleRepository);
  });

  const paginatedResult: PaginatedResult<AdminVehicleListItem> = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
  };

  it("should return paginated admin vehicle list", async () => {
    vehicleRepository.adminFindAll.mockResolvedValue(paginatedResult);

    const dto = { page: 1, limit: 10 } as any;
    const result = await useCase.execute(dto);

    expect(result).toBe(paginatedResult);
    expect(vehicleRepository.adminFindAll).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should pass dto fields to AdminVehicleFilter", async () => {
    vehicleRepository.adminFindAll.mockResolvedValue(paginatedResult);

    const dto = { page: 2, limit: 20, status: "pending", q: "test" } as any;
    await useCase.execute(dto);

    expect(vehicleRepository.adminFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 20, status: "pending", q: "test" }),
    );
  });
});
