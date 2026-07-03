import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createMock, Mock } from "@/tests/utils/mock";
import { ScheduleVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/schedule-vehicle-use-case/schedule-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import { Vehicle, STATUS_VEHICLE, type PrimitiveVehicle } from "@/src/contexts/vehicles/domain/entities/vehicle";

const makePrimitive = (overrides: Partial<PrimitiveVehicle> = {}): PrimitiveVehicle => ({
  id: "vehicle-1",
  mileage: 50000,
  lat: 40.4168,
  lng: -3.7038,
  condition: "used",
  description: "Test vehicle",
  publisher_type: "particular",
  version_id: 1,
  status: STATUS_VEHICLE.ACTIVE,
  status_change_message: null,
  is_featured: false,
  featured_expires_at: null,
  expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  scheduled_publish_at: null,
  renewed_at: null,
  views: 0,
  favorites: 0,
  shares: 0,
  address: null,
  address_details: null,
  transmission_type: "manual",
  traction_id: null,
  power: 100,
  displacement: 1600,
  autonomy: 0,
  battery_capacity: 0,
  time_to_charge: 0,
  license_plate: "1234ABC",
  phone_code: "+34",
  phone: "600000000",
  email: "test@test.com",
  features_ids: [],
  services_ids: [],
  vehicle_type_id: null,
  category_id: null,
  color_id: null,
  dgt_label_id: null,
  warranty_type_id: null,
  cuota_ids: [],
  suggestions: [],
  profile_id: "profile-1",
  ...overrides,
});

describe("ScheduleVehicleUseCase", () => {
  let useCase: ScheduleVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;

  beforeEach(() => {
    vi.useFakeTimers();
    vehicleRepository = createMock<VehicleRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    useCase = new ScheduleVehicleUseCase(vehicleRepository, vehicleSearchIndexer);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should schedule publish for a valid future date", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const vehicle = Vehicle.fromPrimitives(makePrimitive());
    vehicleRepository.findById.mockResolvedValue(vehicle);

    const result = await useCase.execute({ vehicle_id: "vehicle-1", scheduled_publish_at: futureDate });

    expect(result.scheduled_publish_at).toEqual(futureDate);
    expect(result.status).toBe(STATUS_VEHICLE.INACTIVE);
    expect(vehicleRepository.findById).toHaveBeenCalledWith("vehicle-1");
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.INACTIVE);
  });

  it("should throw VehicleNotFoundException when vehicle does not exist", async () => {
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", scheduled_publish_at: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
    ).rejects.toThrow(VehicleNotFoundException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when date is in the past", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const vehicle = Vehicle.fromPrimitives(makePrimitive());
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", scheduled_publish_at: pastDate }),
    ).rejects.toThrow(BadRequestException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when date exceeds 90 days", async () => {
    const tooFarDate = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000);
    const vehicle = Vehicle.fromPrimitives(makePrimitive());
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", scheduled_publish_at: tooFarDate }),
    ).rejects.toThrow(BadRequestException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when vehicle status does not allow scheduling", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ status: STATUS_VEHICLE.SOLD }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", scheduled_publish_at: futureDate }),
    ).rejects.toThrow(BadRequestException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });
});
