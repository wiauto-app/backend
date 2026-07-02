import { describe, it, expect, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateOwnerVehicleStatusUseCase } from "@/src/contexts/vehicles/application/vehicle/update-owner-vehicle-status-use-case/update-owner-vehicle-status.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
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

describe("UpdateOwnerVehicleStatusUseCase", () => {
  let useCase: UpdateOwnerVehicleStatusUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;
  let alertProcessingEnqueueService: Mock<AlertProcessingEnqueueService>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    alertProcessingEnqueueService = createMock<AlertProcessingEnqueueService>();
    useCase = new UpdateOwnerVehicleStatusUseCase(
      vehicleRepository,
      vehicleSearchIndexer,
      alertProcessingEnqueueService,
    );
  });

  it("should deactivate an active vehicle", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ status: STATUS_VEHICLE.ACTIVE }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    const result = await useCase.execute({ vehicle_id: "vehicle-1", status: "inactive" });

    expect(result).toEqual({ status: STATUS_VEHICLE.INACTIVE });
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalledWith(
      expect.objectContaining({ vehicle_id: "vehicle-1" }),
    );
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.INACTIVE);
  });

  it("should reactivate an inactive vehicle", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({
      status: STATUS_VEHICLE.INACTIVE,
      scheduled_publish_at: null,
      status_change_message: null,
    }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    const result = await useCase.execute({ vehicle_id: "vehicle-1", status: "active" });

    expect(result).toEqual({ status: STATUS_VEHICLE.ACTIVE });
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.ACTIVE);
  });

  it("should return early when status is already the same", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ status: STATUS_VEHICLE.ACTIVE }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    const result = await useCase.execute({ vehicle_id: "vehicle-1", status: "active" });

    expect(result).toEqual({ status: STATUS_VEHICLE.ACTIVE });
    expect(vehicleRepository.update).not.toHaveBeenCalled();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).not.toHaveBeenCalled();
  });

  it("should throw when trying to deactivate a non-active vehicle", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ status: STATUS_VEHICLE.PENDING }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", status: "inactive" }),
    ).rejects.toThrow(BadRequestException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should throw when trying to reactivate a non-active, non-inactive vehicle", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ status: STATUS_VEHICLE.PENDING }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", status: "active" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should throw when canOwnerReactivate returns false", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({
      status: STATUS_VEHICLE.INACTIVE,
      scheduled_publish_at: new Date(),
    }));
    vehicleRepository.findById.mockResolvedValue(vehicle);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", status: "active" }),
    ).rejects.toThrow(BadRequestException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should throw VehicleNotFoundException when vehicle does not exist", async () => {
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", status: "active" }),
    ).rejects.toThrow(VehicleNotFoundException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });
});
