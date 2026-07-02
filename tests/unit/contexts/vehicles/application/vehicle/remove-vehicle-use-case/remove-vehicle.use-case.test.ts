import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/remove-vehicle-use-case/remove-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleImageRepository } from "@/src/contexts/vehicles/vehicle-images/domain/vehicle-imagen.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import type { VehicleDetail } from "@/src/contexts/vehicles/domain/read-models/vehicle-detail";

describe("RemoveVehicleUseCase", () => {
  let useCase: RemoveVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleImageRepository: Mock<VehicleImageRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    vehicleImageRepository = createMock<VehicleImageRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    useCase = new RemoveVehicleUseCase(vehicleRepository, vehicleImageRepository, vehicleSearchIndexer);
  });

  it("should remove vehicle and clean up related resources", async () => {
    vehicleRepository.findOne.mockResolvedValue({ id: "vehicle-1" } as VehicleDetail);

    await useCase.execute({ id: "vehicle-1" });

    expect(vehicleRepository.findOne).toHaveBeenCalledWith("vehicle-1");
    expect(vehicleImageRepository.remove_storage_for_vehicle).toHaveBeenCalledWith("vehicle-1");
    expect(vehicleRepository.remove).toHaveBeenCalledWith("vehicle-1");
    expect(vehicleSearchIndexer.deleteVehicle).toHaveBeenCalledWith("vehicle-1");
  });

  it("should throw VehicleNotFoundException when vehicle does not exist", async () => {
    vehicleRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: "vehicle-1" })).rejects.toThrow(VehicleNotFoundException);

    expect(vehicleImageRepository.remove_storage_for_vehicle).not.toHaveBeenCalled();
    expect(vehicleRepository.remove).not.toHaveBeenCalled();
    expect(vehicleSearchIndexer.deleteVehicle).not.toHaveBeenCalled();
  });
});
