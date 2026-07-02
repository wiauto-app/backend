import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/update-vehicle-use-case/update-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { AttachVehicleImagesFromTempUseCase } from "@/src/contexts/vehicles/vehicle-images/application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { SetVehiclePriceUseCase } from "@/src/contexts/vehicles/vehicle-prices/application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { VehiclePriceRepository } from "@/src/contexts/vehicles/vehicle-prices/domain/vehicle-price.repository";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { ReverseGeocodingPort } from "@/src/contexts/vehicles/application/ports/reverse-geocoding.port";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/domain/entities/vehicle";
import type { VehicleDetail } from "@/src/contexts/vehicles/domain/read-models/vehicle-detail";

const makeVehicleDetail = (overrides: Partial<VehicleDetail> = {}): VehicleDetail => ({
  id: "vehicle-1",
  price: 25000,
  mileage: 50000,
  lat: 40.4168,
  lng: -3.7038,
  condition: "used",
  description: "Test vehicle",
  publisher_type: "particular",
  status: STATUS_VEHICLE.ACTIVE,
  status_change_message: null,
  is_featured: false,
  featured_expires_at: null,
  expires_at: new Date(),
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
  vin_code: "VIN123",
  phone_code: "+34",
  phone: "600000000",
  email: "test@test.com",
  version_id: 1,
  profile_id: "profile-1",
  suggestions: [],
  created_at: new Date(),
  updated_at: new Date(),
  version_summary: { make_name: "Toyota", model_name: "Corolla", version_name: "1.8" },
  images: [],
  features: [],
  services: [],
  vehicle_type: null,
  category: null,
  color: null,
  dgt_label: null,
  warranty_type: null,
  cuotas: [],
  prices: [],
  version: {
    id: 1,
    make_id: 1,
    model_id: 1,
    body_type_id: 1,
    fuel_type_id: 1,
    year_id: 1,
    name: "1.8",
    slug: "1-8",
    created_at: new Date(),
    make: { id: 1, name: "Toyota", slug: "toyota", created_at: new Date() },
    model: { id: 1, make_id: 1, model_id: 1, name: "Corolla", slug: "corolla", created_at: new Date() },
    body_type: { id: 1, name: "Sedan", slug: "sedan", doors: 4, created_at: new Date() },
    fuel_type: { id: 1, name: "Gasolina", slug: "gasolina", created_at: new Date() },
    year: { id: 1, year: 2020, slug: "2020", created_at: new Date() },
  },
  traction: null,
  dealership: undefined,
  ...overrides,
});

describe("UpdateVehicleUseCase", () => {
  let useCase: UpdateVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let attachVehicleImagesFromTempUseCase: Mock<AttachVehicleImagesFromTempUseCase>;
  let setVehiclePriceUseCase: Mock<SetVehiclePriceUseCase>;
  let vehiclePriceRepository: Mock<VehiclePriceRepository>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;
  let reverseGeocodingPort: Mock<ReverseGeocodingPort>;
  let alertProcessingEnqueueService: Mock<AlertProcessingEnqueueService>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    attachVehicleImagesFromTempUseCase = createMock<AttachVehicleImagesFromTempUseCase>();
    setVehiclePriceUseCase = createMock<SetVehiclePriceUseCase>();
    vehiclePriceRepository = createMock<VehiclePriceRepository>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    reverseGeocodingPort = createMock<ReverseGeocodingPort>();
    alertProcessingEnqueueService = createMock<AlertProcessingEnqueueService>();

    useCase = new UpdateVehicleUseCase(
      vehicleRepository,
      attachVehicleImagesFromTempUseCase,
      setVehiclePriceUseCase,
      vehiclePriceRepository,
      vehicleSearchIndexer,
      reverseGeocodingPort,
      alertProcessingEnqueueService,
    );
  });

  it("should update basic vehicle fields", async () => {
    const existing = makeVehicleDetail();
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue(null);

    const result = await useCase.execute({
      id: "vehicle-1",
      mileage: 45000,
      description: "Updated description",
    });

    expect(result.vehicle).toBeDefined();
    expect(result.vehicle.mileage).toBe(45000);
    expect(result.vehicle.description).toBe("Updated description");
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(vehicleSearchIndexer.indexVehicle).toHaveBeenCalledWith("vehicle-1");
  });

  it("should update price and alert on price drop", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.ACTIVE });
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue({
      toPrimitives: () => ({ price: 30000 }),
    } as any);

    await useCase.execute({
      id: "vehicle-1",
      price: 25000,
    });

    expect(setVehiclePriceUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ price: 25000, vehicle_id: "vehicle-1" }),
    );
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "price_drop" }),
    );
  });

  it("should update price without alert when status is not active", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.PENDING });
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue({
      toPrimitives: () => ({ price: 30000 }),
    } as any);

    await useCase.execute({
      id: "vehicle-1",
      price: 25000,
    });

    expect(setVehiclePriceUseCase.execute).toHaveBeenCalled();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).not.toHaveBeenCalled();
  });

  it("should resolve address when coordinates change", async () => {
    const existing = makeVehicleDetail({ lat: 40.0, lng: -3.0 });
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue(null);
    reverseGeocodingPort.resolve.mockResolvedValue({
      street: "New Street",
      route: "New Street",
      street_number: "10",
      neighborhood: "New Area",
      municipality: "Barcelona",
      province: "Barcelona",
      country: "España",
      postal_code: "08001",
      formatted_lines: ["New Street, 10", "08001 Barcelona"],
    });

    await useCase.execute({
      id: "vehicle-1",
      lat: 41.3851,
      lng: 2.1734,
    });

    expect(reverseGeocodingPort.resolve).toHaveBeenCalledWith(41.3851, 2.1734);
    expect(vehicleRepository.update).toHaveBeenCalled();

    const updated = (vehicleRepository.update as ReturnType<typeof createMock>).mock.calls[0][0];
    expect(updated.toPrimitives().address).toContain("New Street");
  });

  it("should handle images when provided", async () => {
    const existing = makeVehicleDetail();
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue(null);

    await useCase.execute({
      id: "vehicle-1",
      images: [{ path: "temp/new-img.jpg", order: 1 }],
    });

    expect(attachVehicleImagesFromTempUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ images: [{ path: "temp/new-img.jpg", order: 1 }] }),
    );
  });

  it("should skip non-temp images", async () => {
    const existing = makeVehicleDetail();
    vehicleRepository.findOne.mockResolvedValue(existing);
    vehiclePriceRepository.findActiveByVehicleId.mockResolvedValue(null);

    await useCase.execute({
      id: "vehicle-1",
      images: [{ path: "uploads/final.jpg", order: 1 }],
    });

    expect(attachVehicleImagesFromTempUseCase.execute).not.toHaveBeenCalled();
  });

  it("should throw VehicleNotFoundException when vehicle does not exist", async () => {
    vehicleRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: "vehicle-1", description: "Updated" }),
    ).rejects.toThrow(VehicleNotFoundException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });
});
