import { describe, it, expect, beforeEach } from "vitest";
import { createMock, Mock } from "@/tests/utils/mock";
import { AdminUpdateVehicleStatusUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-update-vehicle-status-use-case/admin-update-vehicle-status.use-case";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/infrastructure/indexing/vehicle-search-indexer.service";
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
  status: STATUS_VEHICLE.PENDING,
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

describe("AdminUpdateVehicleStatusUseCase", () => {
  let useCase: AdminUpdateVehicleStatusUseCase;
  let vehicleRepository: Mock<VehicleRepository>;
  let profileUserRepository: Mock<ProfileUserRepository>;
  let outboundMailEnqueueService: Mock<OutboundMailEnqueueService>;
  let alertProcessingEnqueueService: Mock<AlertProcessingEnqueueService>;
  let vehicleSearchIndexer: Mock<VehicleSearchIndexer>;

  beforeEach(() => {
    vehicleRepository = createMock<VehicleRepository>();
    profileUserRepository = createMock<ProfileUserRepository>();
    outboundMailEnqueueService = createMock<OutboundMailEnqueueService>();
    alertProcessingEnqueueService = createMock<AlertProcessingEnqueueService>();
    vehicleSearchIndexer = createMock<VehicleSearchIndexer>();

    useCase = new AdminUpdateVehicleStatusUseCase(
      vehicleRepository,
      profileUserRepository,
      outboundMailEnqueueService,
      alertProcessingEnqueueService,
      vehicleSearchIndexer,
    );
  });

  it("should change status and send email notification", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.PENDING });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue("owner@test.com");

    const result = await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ACTIVE,
    });

    expect(result.vehicle).toBeDefined();
    expect(result.vehicle.status).toBe(STATUS_VEHICLE.ACTIVE);
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(profileUserRepository.findEmailById).toHaveBeenCalledWith("profile-1");
    expect(outboundMailEnqueueService.enqueue_vehicle_status_changed).toHaveBeenCalled();
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalled();
    expect(vehicleSearchIndexer.syncVehicle).toHaveBeenCalledWith("vehicle-1", STATUS_VEHICLE.ACTIVE);
  });

  it("should return early when status is unchanged", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.ACTIVE });
    vehicleRepository.findOne.mockResolvedValue(existing);

    const result = await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ACTIVE,
    });

    expect(result.vehicle).toBeDefined();
    expect(vehicleRepository.update).not.toHaveBeenCalled();
    expect(outboundMailEnqueueService.enqueue_vehicle_status_changed).not.toHaveBeenCalled();
  });

  it("should set status_change_message when transitioning to non-active status", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.ACTIVE });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue("owner@test.com");

    await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.SOLD,
      message: "Vendido",
    });

    const updated = (vehicleRepository.update as ReturnType<typeof createMock>).mock.calls[0][0];
    expect(updated.toPrimitives().status).toBe(STATUS_VEHICLE.SOLD);
    expect(updated.toPrimitives().status_change_message).toBe("Vendido");
    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalled();
  });

  it("should set status_change_message to null when activating", async () => {
    const existing = makeVehicleDetail({
      status: STATUS_VEHICLE.PENDING,
      status_change_message: "Revisar documentos",
    });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue("owner@test.com");

    await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ACTIVE,
    });

    const updated = (vehicleRepository.update as ReturnType<typeof createMock>).mock.calls[0][0];
    expect(updated.toPrimitives().status_change_message).toBeNull();
  });

  it("should enqueue FEATURED event when activating a featured vehicle", async () => {
    const existing = makeVehicleDetail({
      status: STATUS_VEHICLE.PENDING,
      is_featured: true,
      featured_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue("owner@test.com");

    await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ACTIVE,
    });

    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalledTimes(2);
  });

  it("should enqueue SOLD_REMOVED for sold/archived/inactive transitions", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.ACTIVE });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue("owner@test.com");

    await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ARCHIVED,
    });

    expect(alertProcessingEnqueueService.enqueue_vehicle_event).toHaveBeenCalledTimes(1);
  });

  it("should skip email when profile has no email", async () => {
    const existing = makeVehicleDetail({ status: STATUS_VEHICLE.PENDING });
    vehicleRepository.findOne.mockResolvedValue(existing);
    profileUserRepository.findEmailById.mockResolvedValue(null);

    await useCase.execute({
      vehicle_id: "vehicle-1",
      status: STATUS_VEHICLE.ACTIVE,
    });

    expect(outboundMailEnqueueService.enqueue_vehicle_status_changed).not.toHaveBeenCalled();
  });

  it("should throw VehicleNotFoundException when vehicle does not exist", async () => {
    vehicleRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ vehicle_id: "vehicle-1", status: STATUS_VEHICLE.ACTIVE }),
    ).rejects.toThrow(VehicleNotFoundException);

    expect(vehicleRepository.update).not.toHaveBeenCalled();
  });
});
