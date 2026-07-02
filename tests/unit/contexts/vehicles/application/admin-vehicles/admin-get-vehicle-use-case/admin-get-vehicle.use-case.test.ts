import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { AdminGetVehicleUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-get-vehicle-use-case/admin-get-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import type { AdminVehicleDetail } from "@/src/contexts/vehicles/domain/read-models/admin-vehicle-detail";

describe("AdminGetVehicleUseCase", () => {
  let useCase: AdminGetVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    useCase = new AdminGetVehicleUseCase(vehicleRepository);
  });

  it("should return vehicle when found", async () => {
    const vehicle = { id: "vehicle-1" } as AdminVehicleDetail;
    vehicleRepository.adminFindOne.mockResolvedValue(vehicle);

    const result = await useCase.execute({ id: "vehicle-1" });

    expect(result).toEqual({ vehicle });
    expect(vehicleRepository.adminFindOne).toHaveBeenCalledWith("vehicle-1");
  });

  it("should throw VehicleNotFoundException when not found", async () => {
    vehicleRepository.adminFindOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: "vehicle-1" })).rejects.toThrow(VehicleNotFoundException);
    expect(vehicleRepository.adminFindOne).toHaveBeenCalledWith("vehicle-1");
  });
});
