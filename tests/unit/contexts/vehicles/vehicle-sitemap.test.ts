import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/vehicles/entities/vehicle-images-entity.relation-type", () => ({
  get_vehicle_images_entity: () => class VehicleImagesEntity {},
}));

vi.mock(
  "@/src/contexts/vehicles/vehicle-images/entities/vehicle-images.entity",
  () => ({
    VehicleImagesEntity: class VehicleImagesEntity {},
  }),
);

import {
  VEHICLE_SITEMAP_PAGE_SIZE,
  VehicleSitemapHttpDto,
} from "@/src/contexts/vehicles/api/v1/vehicle-sitemap/vehicle-sitemap.http-dto";
import { VehicleSitemapService } from "@/src/contexts/vehicles/api/v1/vehicle-sitemap/vehicle-sitemap.service";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

describe("VehicleSitemapHttpDto", () => {
  it("aplica page=1 y limit=5000 por defecto", async () => {
    const dto = plainToInstance(VehicleSitemapHttpDto, {}, {
      exposeDefaultValues: true,
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(VEHICLE_SITEMAP_PAGE_SIZE);
  });

  it("transforma page y limit desde query string", async () => {
    const dto = plainToInstance(VehicleSitemapHttpDto, {
      page: "2",
      limit: "1000",
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(1000);
  });

  it.each([
    { page: "0", limit: "5000", property: "page" },
    { page: "1", limit: "0", property: "limit" },
    { page: "1", limit: "5001", property: "limit" },
  ])("rechaza valores fuera de rango: $property", async (input) => {
    const dto = plainToInstance(VehicleSitemapHttpDto, input);
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === input.property)).toBe(
      true,
    );
  });
});

describe("VehicleSitemapService", () => {
  it("devuelve meta con totalPages calculado", async () => {
    const vehicleRepository = {
      countSitemapVehicles: vi.fn().mockResolvedValue(12_500),
      findSitemapVehicles: vi.fn(),
    };
    const service = new VehicleSitemapService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );

    await expect(service.getMeta(5000)).resolves.toEqual({
      total: 12_500,
      limit: 5000,
      totalPages: 3,
    });
    expect(vehicleRepository.countSitemapVehicles).toHaveBeenCalledOnce();
  });

  it("devuelve meta con totalPages 0 cuando no hay vehículos", async () => {
    const vehicleRepository = {
      countSitemapVehicles: vi.fn().mockResolvedValue(0),
      findSitemapVehicles: vi.fn(),
    };
    const service = new VehicleSitemapService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );

    await expect(service.getMeta()).resolves.toEqual({
      total: 0,
      limit: VEHICLE_SITEMAP_PAGE_SIZE,
      totalPages: 0,
    });
  });

  it("delega la paginación al repositorio y devuelve la página", async () => {
    const repositoryResult = {
      data: [
        {
          id: "vehicle-id",
          updatedAt: "2026-09-01T00:00:00.000Z",
          isFeatured: true,
        },
      ],
      total: 1,
    };
    const vehicleRepository = {
      countSitemapVehicles: vi.fn(),
      findSitemapVehicles: vi.fn().mockResolvedValue(repositoryResult),
    };
    const service = new VehicleSitemapService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );
    const dto = plainToInstance(VehicleSitemapHttpDto, {
      page: 2,
      limit: 1000,
    });

    await expect(service.getPage(dto)).resolves.toEqual({
      data: repositoryResult.data,
      total: 1,
      page: 2,
      limit: 1000,
      totalPages: 1,
    });
    expect(vehicleRepository.findSitemapVehicles).toHaveBeenCalledWith({
      page: 2,
      limit: 1000,
    });
  });
});

describe("TypeOrmVehicleRepository sitemap", () => {
  const createRepository = (
    queryBuilder: Record<string, ReturnType<typeof vi.fn>>,
  ) =>
    new TypeOrmVehicleRepository(
      { createQueryBuilder: vi.fn().mockReturnValue(queryBuilder) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

  it("cuenta solo vehículos activos no eliminados", async () => {
    const queryBuilder = {
      where: vi.fn(),
      andWhere: vi.fn(),
      getCount: vi.fn().mockResolvedValue(42),
    };
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);

    const repository = createRepository(queryBuilder);

    await expect(repository.countSitemapVehicles()).resolves.toBe(42);
    expect(queryBuilder.where).toHaveBeenCalledWith("vehicle.status = :status", {
      status: STATUS_VEHICLE.ACTIVE,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "vehicle.deleted_at IS NULL",
    );
  });

  it("pagina por updated_at DESC y mapea id/updatedAt/isFeatured", async () => {
    const updatedAt = new Date("2026-09-01T12:00:00.000Z");
    const featuredExpiresAt = new Date("2027-01-01T00:00:00.000Z");
    const queryBuilder = {
      where: vi.fn(),
      andWhere: vi.fn(),
      select: vi.fn(),
      orderBy: vi.fn(),
      skip: vi.fn(),
      take: vi.fn(),
      getManyAndCount: vi
        .fn()
        .mockResolvedValue([
          [
            {
              id: "vehicle-id",
              updated_at: updatedAt,
              is_featured: true,
              featured_expires_at: featuredExpiresAt,
            },
          ],
          1,
        ]),
    };
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);

    const repository = createRepository(queryBuilder);
    const result = await repository.findSitemapVehicles({ page: 2, limit: 1000 });

    expect(queryBuilder.select).toHaveBeenCalledWith([
      "vehicle.id",
      "vehicle.updated_at",
      "vehicle.is_featured",
      "vehicle.featured_expires_at",
    ]);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "vehicle.updated_at",
      "DESC",
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(1000);
    expect(queryBuilder.take).toHaveBeenCalledWith(1000);
    expect(result).toEqual({
      data: [
        {
          id: "vehicle-id",
          updatedAt: updatedAt.toISOString(),
          isFeatured: true,
        },
      ],
      total: 1,
    });
  });

  it("marca isFeatured false cuando el destacado expiró", async () => {
    const updatedAt = new Date("2026-09-01T12:00:00.000Z");
    const featuredExpiresAt = new Date("2020-01-01T00:00:00.000Z");
    const queryBuilder = {
      where: vi.fn(),
      andWhere: vi.fn(),
      select: vi.fn(),
      orderBy: vi.fn(),
      skip: vi.fn(),
      take: vi.fn(),
      getManyAndCount: vi
        .fn()
        .mockResolvedValue([
          [
            {
              id: "vehicle-id",
              updated_at: updatedAt,
              is_featured: true,
              featured_expires_at: featuredExpiresAt,
            },
          ],
          1,
        ]),
    };
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);

    const repository = createRepository(queryBuilder);
    const result = await repository.findSitemapVehicles({ page: 1, limit: 1000 });

    expect(result.data[0]?.isFeatured).toBe(false);
  });
});
