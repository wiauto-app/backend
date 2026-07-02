import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { FindOwnerVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-owner-vehicles-use-case/find-owner-vehicles.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import type { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import type { OwnerVehicleListItem } from "@/src/contexts/vehicles/domain/read-models/owner-vehicle-list-item";

describe("FindOwnerVehiclesUseCase", () => {
  let useCase: FindOwnerVehiclesUseCase;
  let vehicleRepository: Mock<VehicleRepository>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    useCase = new FindOwnerVehiclesUseCase(vehicleRepository);
  });

  const paginatedResult: PaginatedResult<OwnerVehicleListItem> = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
  };

  it("should return paginated owner vehicles with default filters", async () => {
    vehicleRepository.findAllByProfileId.mockResolvedValue(paginatedResult);

    const result = await useCase.execute({
      profile_id: "profile-1",
      page: 1,
      limit: 10,
    });

    expect(result).toBe(paginatedResult);
    expect(vehicleRepository.findAllByProfileId).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "profile-1",
        page: 1,
        limit: 10,
      }),
    );
  });

  it("should pass status filter when provided", async () => {
    vehicleRepository.findAllByProfileId.mockResolvedValue(paginatedResult);

    await useCase.execute({
      profile_id: "profile-1",
      status: "active",
      page: 1,
      limit: 10,
    });

    expect(vehicleRepository.findAllByProfileId).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });

  it("should pass pagination and sorting parameters", async () => {
    vehicleRepository.findAllByProfileId.mockResolvedValue(paginatedResult);

    await useCase.execute({
      profile_id: "profile-1",
      page: 2,
      limit: 20,
      order_by: "created_at",
      order_direction: "desc",
    });

    expect(vehicleRepository.findAllByProfileId).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
        order_by: "created_at",
        order_direction: "desc",
      }),
    );
  });
});
