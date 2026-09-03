import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import type { VehicleDetail } from "@/src/contexts/vehicles/types/vehicle-detail";
import {
  normalizeNullableUuid,
  PUBLISHER_TYPE,
  STATUS_VEHICLE,
} from "@/src/contexts/vehicles/types/vehicle";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";

const createExistingVehicle = (): VehicleDetail =>
  ({
    id: vehicle_id,
    mileage: 10_000,
    lat: 40.4168,
    lng: -3.7038,
    condition: "used",
    description: "Vehículo en buen estado",
    version_id: 1,
    publisher_type: PUBLISHER_TYPE.PARTICULAR,
    transmission_type: "automatic",
    traction: null,
    power: 150,
    displacement: 1998,
    autonomy: 0,
    battery_capacity: 0,
    time_to_charge: 0,
    license_plate: "1234ABC",
    vin_code: "",
    phone_code: "+34",
    phone: "600000000",
    has_whatsapp: false,
    show_phone: true,
    email: "seller@example.com",
    features: [],
    services: [],
    vehicle_type: null,
    category: null,
    color: null,
    dgt_label: null,
    warranty_type: null,
    cuotas: [],
    suggestions: [],
    profile_id,
    status: STATUS_VEHICLE.PENDING,
    status_change_message: null,
    is_featured: false,
    expires_at: new Date("2026-11-18T00:00:00Z"),
    views: 0,
    favorites: 0,
    shares: 0,
    created_at: new Date("2026-08-20T00:00:00Z"),
    updated_at: new Date("2026-08-20T00:00:00Z"),
    address: null,
    address_details: null,
    show_first_cuota: false,
    by_brand_warranty: false,
    show_exact_location: false,
    finance_price: null,
    first_cuota: null,
    prices: [],
    images: [],
    dealership: {
      id: "",
      name: "",
      slug: "",
      description: "",
      email: "",
      phone_code: "",
      schedules: [],
    },
  }) as unknown as VehicleDetail;

const createService = (status = STATUS_VEHICLE.PENDING) => {
  const existing = { ...createExistingVehicle(), status };
  const vehicle_repository = {
    findOne: vi.fn().mockResolvedValue(existing),
    update: vi.fn().mockResolvedValue(),
    patch: vi.fn().mockResolvedValue(),
  };
  const set_vehicle_price_service = {
    execute: vi.fn().mockResolvedValue(),
  };
  const vehicle_search_indexer = {
    indexVehicle: vi.fn().mockResolvedValue(),
  };
  const alert_processing_enqueue_service = {
    enqueue_vehicle_event: vi.fn().mockResolvedValue(),
  };
  const video_manager = {
    delete: vi.fn().mockResolvedValue({ affected: 0 }),
    create: vi.fn((_target: unknown, payload: unknown) => payload),
    save: vi.fn().mockResolvedValue([]),
  };
  const videos_repository = {
    manager: {
      transaction: vi.fn(
        (callback: (manager: typeof video_manager) => Promise<void>) =>
          callback(video_manager),
      ),
    },
  };
  const promote_temp_storage_paths_service = {
    execute: vi.fn().mockResolvedValue({
      pathnames: ["/vehicles-videos/gallery/video.mp4"],
    }),
    rollback: vi.fn().mockResolvedValue(),
  };
  const service = new VehicleService(
    vehicle_repository as never,
    { execute: vi.fn() } as never,
    set_vehicle_price_service as never,
    {} as never,
    vehicle_search_indexer as never,
    { resolve: vi.fn() } as never,
    alert_processing_enqueue_service as never,
    { findById: vi.fn().mockResolvedValue({ fuel_type_id: 2 }) } as never,
    { findById: vi.fn().mockResolvedValue({ can_charge: false }) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { findOneByProfileId: vi.fn().mockResolvedValue(null) } as never,
    {} as never,
    videos_repository as never,
    promote_temp_storage_paths_service as never,
  );

  return {
    service,
    vehicle_repository,
    set_vehicle_price_service,
    vehicle_search_indexer,
    alert_processing_enqueue_service,
    video_manager,
    videos_repository,
    promote_temp_storage_paths_service,
  };
};

describe("vehicle update flow", () => {
  it("normalizes blank optional UUIDs to null", () => {
    expect(normalizeNullableUuid("")).toBeNull();
    expect(normalizeNullableUuid("   ")).toBeNull();
  });

  it("never carries a blank dealership UUID into persistence", async () => {
    const { service, vehicle_repository } = createService();

    await service.update({ id: vehicle_id, finance_price: 12_000 });

    expect(vehicle_repository.patch).toHaveBeenCalledWith(
      vehicle_id,
      expect.objectContaining({ finance_price: 12_000 }),
    );
    expect(vehicle_repository.patch.mock.calls[0][1]).not.toHaveProperty(
      "dealership_id",
    );
  });

  it("only sends the changed fields to persistence", async () => {
    const { service, vehicle_repository } = createService();

    await service.update({ id: vehicle_id, mileage: 55_000 });

    const [, patch] = vehicle_repository.patch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(Object.keys(patch).toSorted()).toEqual(["mileage", "suggestions"]);
  });

  it("persists show_review_collab in both directions", async () => {
    const enabled = createService();
    await enabled.service.update({ id: vehicle_id, show_review_collab: true });
    expect(enabled.vehicle_repository.patch).toHaveBeenCalledWith(
      vehicle_id,
      expect.objectContaining({ show_review_collab: true }),
    );

    const disabled = createService();
    await disabled.service.update({ id: vehicle_id, show_review_collab: false });
    expect(disabled.vehicle_repository.patch).toHaveBeenCalledWith(
      vehicle_id,
      expect.objectContaining({ show_review_collab: false }),
    );
  });

  it("trims and patches optional ref", async () => {
    const { service, vehicle_repository } = createService();

    await service.update({ id: vehicle_id, ref: "  REF-42  " });

    expect(vehicle_repository.patch).toHaveBeenCalledWith(
      vehicle_id,
      expect.objectContaining({ ref: "REF-42" }),
    );
  });

  it("clears ref when blank string is sent", async () => {
    const { service, vehicle_repository } = createService();

    await service.update({ id: vehicle_id, ref: "   " });

    expect(vehicle_repository.patch).toHaveBeenCalledWith(
      vehicle_id,
      expect.objectContaining({ ref: null }),
    );
  });

  it("does not persist, index or notify for an empty patch", async () => {
    const {
      service,
      vehicle_repository,
      vehicle_search_indexer,
      alert_processing_enqueue_service,
    } = createService(STATUS_VEHICLE.ACTIVE);

    await service.update({ id: vehicle_id });

    expect(vehicle_repository.patch).not.toHaveBeenCalled();
    expect(vehicle_search_indexer.indexVehicle).not.toHaveBeenCalled();
    expect(
      alert_processing_enqueue_service.enqueue_vehicle_event,
    ).not.toHaveBeenCalled();
  });

  it("delegates price changes without enqueueing a duplicate price-drop event", async () => {
    const {
      service,
      set_vehicle_price_service,
      alert_processing_enqueue_service,
    } = createService(STATUS_VEHICLE.ACTIVE);

    await service.update({ id: vehicle_id, price: 9000 });

    expect(set_vehicle_price_service.execute).toHaveBeenCalledWith(
      expect.objectContaining({ vehicle_id, price: 9000 }),
    );
    expect(
      alert_processing_enqueue_service.enqueue_vehicle_event,
    ).not.toHaveBeenCalled();
  });

  it("restores temporary videos when their database replacement fails", async () => {
    const database_error = new Error("video persistence failed");
    const {
      service,
      videos_repository,
      promote_temp_storage_paths_service,
    } = createService();
    videos_repository.manager.transaction.mockRejectedValueOnce(database_error);

    await expect(
      service.update({
        id: vehicle_id,
        videos: [
          {
            path: "vehicles-videos/temp/gallery/video.mp4",
            order: 0,
          },
        ],
      }),
    ).rejects.toBe(database_error);

    expect(promote_temp_storage_paths_service.rollback).toHaveBeenCalledWith({
      paths: ["vehicles-videos/temp/gallery/video.mp4"],
    });
  });
});
