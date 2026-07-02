import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import type { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import type { VehicleListItemDto } from "@/src/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/vehicle-list-item.dto";

describe("FindAllVehiclesUseCase", () => {
  let useCase: FindAllVehiclesUseCase;
  let vehicleRepository: Mock<VehicleRepository>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    useCase = new FindAllVehiclesUseCase(vehicleRepository);
  });

  const paginatedResult: PaginatedResult<VehicleListItemDto> = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
  };

  it("should return paginated results from repository", async () => {
    vehicleRepository.findAll.mockResolvedValue(paginatedResult);

    const dto = { page: 1, limit: 10 } as any;
    const result = await useCase.execute(dto);

    expect(result).toBe(paginatedResult);
    expect(vehicleRepository.findAll).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should pass dto fields to VehicleFilter", async () => {
    vehicleRepository.findAll.mockResolvedValue(paginatedResult);

    const dto = {
      page: 2,
      limit: 20,
      make_id: 5,
      model_id: 10,
      min_price: 10000,
      max_price: 50000,
      condition: "used",
    } as any;

    await useCase.execute(dto);

    expect(vehicleRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
        make_id: 5,
        model_id: 10,
        min_price: 10000,
        max_price: 50000,
        condition: "used",
      }),
    );
  });
});
