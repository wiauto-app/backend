import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { ProcessScheduledVehiclePublishUseCase } from "@/src/contexts/vehicles/application/vehicle/process-scheduled-vehicle-publish-use-case/process-scheduled-vehicle-publish.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
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
  status: STATUS_VEHICLE.INACTIVE,
  status_change_message: null,
  is_featured: false,
  featured_expires_at: null,
  expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  scheduled_publish_at: new Date(Date.now() - 1000),
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

describe("ProcessScheduledVehiclePublishUseCase", () => {
  let useCase: ProcessScheduledVehiclePublishUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;
  let alertProcessingEnqueueService: Mock<AlertProcessingEnqueueService>;

  beforeEach(() => {
    vi.useFakeTimers();
    vehicleRepository = createMock<VehicleRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    alertProcessingEnqueueService = createMock<AlertProcessingEnqueueService>();
    useCase = new ProcessScheduledVehiclePublishUseCase(
      vehicleRepository,
      vehicleSearchIndexer,
      alertProcessingEnqueueService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should publish vehicles whose scheduled time has arrived (approved before)", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive());
    vehicleRepository.findScheduledForPublish.mockResolvedValue([vehicle]);
    vehicleRepository.profileHasApprovedAdsBefore.mockResolvedValue(true);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 1 });
    expect(vehicleRepository.findScheduledForPublish).toHaveBeenCalled();
    expect(vehicleRepository.profileHasApprovedAdsBefore).toHaveBeenCalledWith("profile-1", "vehicle-1");

    const updated = (vehicleRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updated.toPrimitives().status).toBe(STATUS_VEHICLE.ACTIVE);
    expect(updated.toPrimitives().scheduled_publish_at).toBeNull();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.ACTIVE);
  });

  it("should set status to PENDING for first-time publishers", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive());
    vehicleRepository.findScheduledForPublish.mockResolvedValue([vehicle]);
    vehicleRepository.profileHasApprovedAdsBefore.mockResolvedValue(false);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 1 });

    const updated = (vehicleRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updated.toPrimitives().status).toBe(STATUS_VEHICLE.PENDING);
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).not.toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.PENDING);
  });

  it("should skip vehicles without profile_id", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ profile_id: undefined }));
    vehicleRepository.findScheduledForPublish.mockResolvedValue([vehicle]);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 0 });
    expect(vehicleRepository.update).not.toHaveBeenCalled();
    expect(vehicleRepository.profileHasApprovedAdsBefore).not.toHaveBeenCalled();
  });

  it("should return zero when no vehicles are scheduled for publish", async () => {
    vehicleRepository.findScheduledForPublish.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 0 });
    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });

  it("should process multiple vehicles", async () => {
    const vehicle1 = Vehicle.fromPrimitives(makePrimitive({ id: "v1", profile_id: "p1" }));
    const vehicle2 = Vehicle.fromPrimitives(makePrimitive({ id: "v2", profile_id: "p1" }));
    vehicleRepository.findScheduledForPublish.mockResolvedValue([vehicle1, vehicle2]);
    vehicleRepository.profileHasApprovedAdsBefore.mockResolvedValue(true);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 2 });
    expect(vehicleRepository.update).toHaveBeenCalledTimes(2);
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledTimes(2);
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalledTimes(2);
  });
});
