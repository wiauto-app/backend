import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { ExpireFeaturedVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/expire-featured-vehicles-use-case/expire-featured-vehicles.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
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
  is_featured: true,
  featured_expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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

describe("ExpireFeaturedVehiclesUseCase", () => {
  let useCase: ExpireFeaturedVehiclesUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;

  beforeEach(() => {
    vi.useFakeTimers();
    vehicleRepository = createMock<VehicleRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    useCase = new ExpireFeaturedVehiclesUseCase(vehicleRepository, vehicleSearchIndexer);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should process all expired featured vehicles", async () => {
    const vehicle1 = Vehicle.fromPrimitives(makePrimitive({ id: "v1" }));
    const vehicle2 = Vehicle.fromPrimitives(makePrimitive({ id: "v2" }));
    vehicleRepository.findExpiredFeatured.mockResolvedValue([vehicle1, vehicle2]);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 2 });
    expect(vehicleRepository.findExpiredFeatured).toHaveBeenCalled();
    expect(vehicleRepository.update).toHaveBeenCalledTimes(2);
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledTimes(2);

    const updatedVehicle1 = (vehicleRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updatedVehicle1.toPrimitives().is_featured).toBe(false);
    expect(updatedVehicle1.toPrimitives().featured_expires_at).toBeNull();
  });

  it("should return zero when no vehicles have expired featured", async () => {
    vehicleRepository.findExpiredFeatured.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({ processed: 0 });
    expect(vehicleRepository.update).not.toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).not.toHaveBeenCalled();
  });

  it("should skip vehicles without keeping featured_expires_at after un-featuring", async () => {
    const vehicle = Vehicle.fromPrimitives(makePrimitive({ id: "v1" }));
    vehicleRepository.findExpiredFeatured.mockResolvedValue([vehicle]);

    await useCase.execute();

    const updatedVehicle = (vehicleRepository.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const primitives = updatedVehicle.toPrimitives();
    expect(primitives.is_featured).toBe(false);
    expect(primitives.featured_expires_at).toBeNull();
    expect(primitives.status).toBe(STATUS_VEHICLE.ACTIVE);
  });
});
