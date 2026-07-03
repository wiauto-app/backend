import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { DuplicateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/duplicate-vehicle-use-case/duplicate-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/domain/entities/vehicle";

describe("DuplicateVehicleUseCase", () => {
  let useCase: DuplicateVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    useCase = new DuplicateVehicleUseCase(vehicleRepository, vehicleSearchIndexer);
  });

  it("should duplicate a vehicle and index the new copy", async () => {
    const newVehicleId = "new-vehicle-id";
    vehicleRepository.duplicate.mockResolvedValue(newVehicleId);

    const result = await useCase.execute({ vehicle_id: "vehicle-1" });

    expect(result).toEqual({ vehicle_id: newVehicleId });
    expect(vehicleRepository.duplicate).toHaveBeenCalledWith("vehicle-1");
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith(newVehicleId, STATUS_VEHICLE.PENDING);
  });
});
