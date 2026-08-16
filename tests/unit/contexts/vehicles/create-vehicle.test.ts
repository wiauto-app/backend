/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UnauthorizedException } from "@nestjs/common";
import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { CreateVehicleController } from "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.controller";
import { CreateVehicleDto } from "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.http-dto";
import {
  CreateVehicleService,
  validateVehicleCreationRules,
} from "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.service";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehiclePriceEntity } from "@/src/contexts/vehicles/vehicle-prices/entities/vehicle-price.entity";
import {
  CONDITION_VEHICLE,
  TRANSMISSION_TYPE,
} from "@/src/contexts/vehicles/types/vehicle";

const validDto = (): CreateVehicleDto =>
  plainToInstance(CreateVehicleDto, {
    price: 25_000,
    mileage: 10_000,
    lat: -2.17,
    lng: -79.9,
    condition: CONDITION_VEHICLE.USED,
    description: "Vehículo en buen estado",
    version_id: 1,
    phone_code: "+593",
    phone: "0999999999",
    email: "seller@example.com",
    transmission_type: TRANSMISSION_TYPE.AUTOMATIC,
    traction_id: "56aa4e9f-19cc-49aa-bb01-50a23c410f46",
    show_exact_location: false,
    show_first_cuota: false,
    by_brand_warranty: false,
  });

describe("CreateVehicleDto", () => {
  it("accepts the canonical create contract", async () => {
    expect(await validate(validDto())).toHaveLength(0);
  });

  it("rejects a negative price", async () => {
    const dto = validDto();
    dto.price = -1;

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "price")).toBe(true);
  });
});

describe("vehicle creation rules", () => {
  it("suggests new condition for a low-mileage used vehicle", () => {
    const suggestions = validateVehicleCreationRules({
      battery_capacity: 0,
      time_to_charge: 0,
      autonomy: 0,
      displacement: 2000,
      mileage: 500,
      condition: CONDITION_VEHICLE.USED,
      can_charge: false,
    });

    expect(suggestions).toHaveLength(1);
  });

  it("rejects electric data for a non-chargeable fuel type", () => {
    expect(() =>
      validateVehicleCreationRules({
        battery_capacity: 60,
        time_to_charge: 0,
        autonomy: 0,
        displacement: 0,
        mileage: 0,
        condition: CONDITION_VEHICLE.NEW,
        can_charge: false,
      }),
    ).toThrow();
  });

  it("rejects combustion displacement for a chargeable fuel type", () => {
    expect(() =>
      validateVehicleCreationRules({
        battery_capacity: 60,
        time_to_charge: 30,
        autonomy: 400,
        displacement: 2000,
        mileage: 0,
        condition: CONDITION_VEHICLE.NEW,
        can_charge: true,
      }),
    ).toThrow();
  });
});

describe("CreateVehicleController", () => {
  it("delegates the validated dto and authenticated profile id", async () => {
    const create = vi.fn().mockResolvedValue({ vehicle: { id: "vehicle-id" } });
    const controller = new CreateVehicleController({ create } as never);
    const dto = validDto();

    await controller.run(dto, { user: { id: "profile-id" } } as never);

    expect(create).toHaveBeenCalledWith(dto, "profile-id");
  });

  it("rejects a missing authenticated user", () => {
    const controller = new CreateVehicleController({ create: vi.fn() } as never);

    expect(() => controller.run(validDto(), {} as never)).toThrow(
      UnauthorizedException,
    );
  });
});

describe("CreateVehicleService", () => {
  it("stores vehicle and active price in the same transaction", async () => {
    const saved_targets: unknown[] = [];
    const manager = {
      findBy: vi.fn().mockResolvedValue([]),
      exists: vi.fn().mockResolvedValue(true),
      create: vi.fn((_target, payload) => payload),
      save: vi.fn(async (target, payload) => {
        saved_targets.push(target);
        if (target === VehicleEntity) {
          return {
            ...payload,
            id: "vehicle-id",
            ref: 42,
            created_at: new Date("2026-08-16T00:00:00Z"),
            updated_at: new Date("2026-08-16T00:00:00Z"),
          };
        }
        return payload;
      }),
    };
    const data_source = {
      getRepository: vi.fn(() => ({
        findOne: vi.fn().mockResolvedValue(null),
      })),
      transaction: vi.fn(async (callback) => callback(manager)),
    };
    const service = new CreateVehicleService(
      data_source as never,
      { findById: vi.fn().mockResolvedValue({ fuel_type_id: 10 }) } as never,
      { findById: vi.fn().mockResolvedValue({ can_charge: false }) } as never,
      { resolve: vi.fn().mockResolvedValue(null) } as never,
      { execute: vi.fn() } as never,
      { syncVehicle: vi.fn().mockResolvedValue(null) } as never,
      { scheduleForVehicle: vi.fn().mockResolvedValue(null) } as never,
      { findEmailById: vi.fn().mockResolvedValue(null) } as never,
      { findOne: vi.fn().mockResolvedValue(null) } as never,
      { enqueue_vehicle_published: vi.fn() } as never,
    );

    const result = await service.create(validDto(), "profile-id");

    expect(data_source.transaction).toHaveBeenCalledOnce();
    expect(saved_targets).toContain(VehicleEntity);
    expect(saved_targets).toContain(VehiclePriceEntity);
    expect(result.vehicle.id).toBe("vehicle-id");
    expect(result.vehicle.profile_id).toBe("profile-id");
  });
});
