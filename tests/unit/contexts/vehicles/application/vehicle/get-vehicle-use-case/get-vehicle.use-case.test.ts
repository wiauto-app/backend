import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { GetVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/get-vehicle-use-case/get-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import type { VehicleDetail } from "@/src/contexts/vehicles/domain/read-models/vehicle-detail";

describe("GetVehicleUseCase", () => {
  let useCase: GetVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    useCase = new GetVehicleUseCase(vehicleRepository);
  });

  it("should return vehicle detail when found", async () => {
    const vehicleDetail = { id: "vehicle-1" } as VehicleDetail;
    vehicleRepository.findOne.mockResolvedValue(vehicleDetail);

    const result = await useCase.execute({ id: "vehicle-1" });

    expect(result).toBe(vehicleDetail);
    expect(vehicleRepository.findOne).toHaveBeenCalledWith("vehicle-1");
  });

  it("should throw VehicleNotFoundException when not found", async () => {
    vehicleRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: "vehicle-1" })).rejects.toThrow(VehicleNotFoundException);
    expect(vehicleRepository.findOne).toHaveBeenCalledWith("vehicle-1");
  });
});
