import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { CreateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/create-vehicle-use-case/create-vehicle.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { AttachVehicleImagesFromTempUseCase } from "@/src/contexts/vehicles/vehicle-images/application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { SetVehiclePriceUseCase } from "@/src/contexts/vehicles/vehicle-prices/application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { ValidateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/validate-vehicle-use-case/validate-vehicle.use-case";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
import { ReverseGeocodingPort } from "@/src/contexts/vehicles/application/ports/reverse-geocoding.port";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/domain/entities/vehicle";
import type { CreateVehicleDto } from "@/src/contexts/vehicles/application/vehicle/create-vehicle-use-case/create-vehicle.dto";

describe("CreateVehicleUseCase", () => {
  let useCase: CreateVehicleUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let attachVehicleImagesFromTempUseCase: Mock<AttachVehicleImagesFromTempUseCase>;
  let validateVehicleUseCase: Mock<ValidateVehicleUseCase>;
  let setVehiclePriceUseCase: Mock<SetVehiclePriceUseCase>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;
  let reverseGeocodingPort: Mock<ReverseGeocodingPort>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    attachVehicleImagesFromTempUseCase = createMock<AttachVehicleImagesFromTempUseCase>();
    validateVehicleUseCase = createMock<ValidateVehicleUseCase>();
    setVehiclePriceUseCase = createMock<SetVehiclePriceUseCase>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();
    reverseGeocodingPort = createMock<ReverseGeocodingPort>();

    useCase = new CreateVehicleUseCase(
      vehicleRepository,
      attachVehicleImagesFromTempUseCase,
      validateVehicleUseCase,
      setVehiclePriceUseCase,
      vehicleSearchIndexer,
      reverseGeocodingPort,
    );
  });

  const createDto: CreateVehicleDto = {
    vin_code: "VIN123",
    price: 25000,
    mileage: 50000,
    lat: 40.4168,
    lng: -3.7038,
    condition: "used",
    description: "Test vehicle description",
    version_id: 1,
    publisher_type: "particular",
    transmission_type: "manual",
    traction_id: "traction-1",
    power: 100,
    displacement: 1600,
    autonomy: 0,
    battery_capacity: 0,
    time_to_charge: 0,
    license_plate: "1234ABC",
    phone_code: "+34",
    phone: "600000000",
    email: "test@test.com",
    vehicle_type_id: "type-1",
    category_id: "cat-1",
    features_ids: ["feat-1"],
    services_ids: ["svc-1"],
    color_id: "color-1",
    dgt_label_id: "dgt-1",
    warranty_type_id: "warr-1",
    cuota_ids: ["cuota-1"],
    images: [{ path: "temp/img.jpg", order: 1 }],
  };

  it("should create a vehicle with all fields", async () => {
    validateVehicleUseCase.execute.mockResolvedValue({ suggestions: [] });
    reverseGeocodingPort.resolve.mockResolvedValue({
      street: "Calle Mayor",
      route: "Calle Mayor",
      street_number: "1",
      neighborhood: "Centro",
      municipality: "Madrid",
      province: "Madrid",
      country: "España",
      postal_code: "28001",
      formatted_lines: ["Calle Mayor, 1", "28001 Madrid"],
    });

    const result = await useCase.execute(createDto, "profile-1");

    expect(result.vehicle).toBeDefined();
    expect(result.vehicle.id).toBeDefined();
    expect(result.vehicle.profile_id).toBe("profile-1");
    expect(result.vehicle.status).toBe(STATUS_VEHICLE.PENDING);
    expect(result.vehicle.description).toBe("Test vehicle description");

    expect(validateVehicleUseCase.execute).toHaveBeenCalled();
    expect(reverseGeocodingPort.resolve).toHaveBeenCalledWith(40.4168, -3.7038);
    expect(vehicleRepository.save).toHaveBeenCalled();
    expect(setVehiclePriceUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ price: 25000 }),
    );
    expect(attachVehicleImagesFromTempUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ images: [{ path: "temp/img.jpg", order: 1 }] }),
    );
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith(
      expect.any(String),
      STATUS_VEHICLE.PENDING,
    );
  });

  it("should create a vehicle without images", async () => {
    validateVehicleUseCase.execute.mockResolvedValue({ suggestions: [] });
    reverseGeocodingPort.resolve.mockResolvedValue(null);

    const dtoWithoutImages = { ...createDto, images: [] };
    const result = await useCase.execute(dtoWithoutImages, "profile-1");

    expect(result.vehicle).toBeDefined();
    expect(reverseGeocodingPort.resolve).toHaveBeenCalled();
    expect(vehicleRepository.save).toHaveBeenCalled();
    expect(setVehiclePriceUseCase.execute).toHaveBeenCalled();
    expect(attachVehicleImagesFromTempUseCase.execute).not.toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalled();
  });

  it("should create a vehicle without optional catalog IDs", async () => {
    validateVehicleUseCase.execute.mockResolvedValue({ suggestions: [] });
    reverseGeocodingPort.resolve.mockResolvedValue(null);

    const minimalDto: CreateVehicleDto = {
      price: 15000,
      mileage: 20000,
      lat: 41.3851,
      lng: 2.1734,
      condition: "new",
      description: "Minimal ad",
      version_id: 2,
      transmission_type: "automatic",
      traction_id: null as any,
      power: 150,
      displacement: 2000,
      phone_code: "+34",
      phone: "611111111",
      email: "minimal@test.com",
    };

    const result = await useCase.execute(minimalDto, "profile-2");

    expect(result.vehicle).toBeDefined();
    expect(result.vehicle.profile_id).toBe("profile-2");
    expect(result.vehicle.features_ids).toEqual([]);
    expect(result.vehicle.services_ids).toEqual([]);
    expect(result.vehicle.vehicle_type_id).toBeNull();
    expect(result.vehicle.cuota_ids).toEqual([]);
  });

  it("should trim the description", async () => {
    validateVehicleUseCase.execute.mockResolvedValue({ suggestions: [] });
    reverseGeocodingPort.resolve.mockResolvedValue(null);

    const dtoWithSpaces = { ...createDto, description: "  Description with spaces  " };
    const result = await useCase.execute(dtoWithSpaces, "profile-1");

    expect(result.vehicle.description).toBe("Description with spaces");
  });
});
