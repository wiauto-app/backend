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
  VEHICLE_SITEMAP_LISTING_PAGE_SIZE,
  VehicleSitemapListHttpDto,
  VehicleSitemapListMetaHttpDto,
} from "@/src/contexts/vehicles/api/v1/vehicle-sitemap-list/vehicle-sitemap-list.http-dto";
import { VehicleSitemapListService } from "@/src/contexts/vehicles/api/v1/vehicle-sitemap-list/vehicle-sitemap-list.service";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { SitemapVehiclesListService } from "@/src/contexts/vehicles/services/sitemap-vehicles-list.service";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

describe("VehicleSitemapListHttpDto", () => {
  it("requiere variant y aplica page=1 y limit=5000 por defecto", async () => {
    const dto = plainToInstance(
      VehicleSitemapListHttpDto,
      { variant: "catalog" },
      { exposeDefaultValues: true },
    );

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(VEHICLE_SITEMAP_LISTING_PAGE_SIZE);
  });

  it("transforma page y limit desde query string", async () => {
    const dto = plainToInstance(VehicleSitemapListHttpDto, {
      variant: "with-province",
      page: "2",
      limit: "1000",
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(1000);
  });

  it.each([
    { variant: "invalid", page: "1", limit: "5000", property: "variant" },
    { variant: "catalog", page: "0", limit: "5000", property: "page" },
    { variant: "catalog", page: "1", limit: "0", property: "limit" },
    { variant: "catalog", page: "1", limit: "5001", property: "limit" },
  ])("rechaza valores fuera de rango: $property", async (input) => {
    const dto = plainToInstance(VehicleSitemapListHttpDto, input);
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === input.property)).toBe(
      true,
    );
  });
});

describe("VehicleSitemapListMetaHttpDto", () => {
  it("requiere variant y aplica limit=5000 por defecto", async () => {
    const dto = plainToInstance(
      VehicleSitemapListMetaHttpDto,
      { variant: "catalog" },
      { exposeDefaultValues: true },
    );

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.limit).toBe(VEHICLE_SITEMAP_LISTING_PAGE_SIZE);
  });
});

describe("SitemapVehiclesListService", () => {
  it("devuelve meta con totalPages calculado y variant", async () => {
    const vehicleRepository = {
      countSitemapVehicleListings: vi.fn().mockResolvedValue(12_500),
      findSitemapVehicleListings: vi.fn(),
    };
    const service = new SitemapVehiclesListService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );

    await expect(service.getMeta("catalog", 5000)).resolves.toEqual({
      total: 12_500,
      limit: 5000,
      totalPages: 3,
      variant: "catalog",
    });
    expect(vehicleRepository.countSitemapVehicleListings).toHaveBeenCalledWith({
      variant: "catalog",
    });
  });

  it("devuelve meta con totalPages 0 cuando no hay combinaciones", async () => {
    const vehicleRepository = {
      countSitemapVehicleListings: vi.fn().mockResolvedValue(0),
      findSitemapVehicleListings: vi.fn(),
    };
    const service = new SitemapVehiclesListService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );

    await expect(service.getMeta("with-province", 5000)).resolves.toEqual({
      total: 0,
      limit: 5000,
      totalPages: 0,
      variant: "with-province",
    });
  });

  it("delega la paginación al repositorio y devuelve la página", async () => {
    const repositoryResult = {
      data: [
        {
          makeSlug: "toyota",
          modelSlug: "avensis",
          provinceSlug: "tarragona",
        },
      ],
      total: 1,
    };
    const vehicleRepository = {
      countSitemapVehicleListings: vi.fn(),
      findSitemapVehicleListings: vi.fn().mockResolvedValue(repositoryResult),
    };
    const service = new SitemapVehiclesListService(
      vehicleRepository as unknown as TypeOrmVehicleRepository,
    );

    await expect(
      service.getPage({ variant: "with-province", page: 2, limit: 1000 }),
    ).resolves.toEqual({
      data: repositoryResult.data,
      total: 1,
      page: 2,
      limit: 1000,
      totalPages: 1,
      variant: "with-province",
    });
    expect(vehicleRepository.findSitemapVehicleListings).toHaveBeenCalledWith({
      page: 2,
      limit: 1000,
      variant: "with-province",
    });
  });
});

describe("VehicleSitemapListService", () => {
  it("delega getMeta y getPage al servicio de listado", async () => {
    const sitemapVehiclesListService = {
      getMeta: vi.fn().mockResolvedValue({
        total: 10,
        limit: 5000,
        totalPages: 1,
        variant: "catalog",
      }),
      getPage: vi.fn().mockResolvedValue({
        data: [{ makeSlug: "toyota", modelSlug: "avensis" }],
        total: 1,
        page: 1,
        limit: 5000,
        totalPages: 1,
        variant: "catalog",
      }),
    };
    const service = new VehicleSitemapListService(
      sitemapVehiclesListService as unknown as SitemapVehiclesListService,
    );
    const metaDto = plainToInstance(VehicleSitemapListMetaHttpDto, {
      variant: "catalog",
    });
    const pageDto = plainToInstance(VehicleSitemapListHttpDto, {
      variant: "catalog",
      page: 1,
      limit: 5000,
    });

    await service.getMeta(metaDto);
    await service.getPage(pageDto);

    expect(sitemapVehiclesListService.getMeta).toHaveBeenCalledWith(
      "catalog",
      5000,
    );
    expect(sitemapVehiclesListService.getPage).toHaveBeenCalledWith({
      variant: "catalog",
      page: 1,
      limit: 5000,
    });
  });
});

describe("TypeOrmVehicleRepository sitemap listings", () => {
  const createRepository = (
    queryBuilder: Record<string, ReturnType<typeof vi.fn>>,
    managerQueryBuilder?: Record<string, ReturnType<typeof vi.fn>>,
  ) =>
    new TypeOrmVehicleRepository(
      {
        createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
        manager: {
          createQueryBuilder: vi
            .fn()
            .mockReturnValue(managerQueryBuilder ?? queryBuilder),
        },
      } as never,
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

  const createListingQueryBuilder = () => {
    const queryBuilder = {
      innerJoin: vi.fn(),
      where: vi.fn(),
      andWhere: vi.fn(),
      select: vi.fn(),
      addSelect: vi.fn(),
      groupBy: vi.fn(),
      addGroupBy: vi.fn(),
      orderBy: vi.fn(),
      addOrderBy: vi.fn(),
      offset: vi.fn(),
      limit: vi.fn(),
      getQuery: vi.fn().mockReturnValue("SELECT 1"),
      getParameters: vi.fn().mockReturnValue({ status: STATUS_VEHICLE.ACTIVE }),
      getRawMany: vi.fn().mockResolvedValue([
        {
          make_slug: "toyota",
          model_slug: "avensis",
        },
      ]),
      getRawOne: vi.fn().mockResolvedValue({ total: "42" }),
    };

    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.groupBy.mockReturnValue(queryBuilder);
    queryBuilder.addGroupBy.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.offset.mockReturnValue(queryBuilder);
    queryBuilder.limit.mockReturnValue(queryBuilder);

    return queryBuilder;
  };

  it("cuenta combinaciones catalog con filtros activos", async () => {
    const listingQueryBuilder = createListingQueryBuilder();
    const countQueryBuilder = {
      select: vi.fn(),
      from: vi.fn(),
      setParameters: vi.fn(),
      getRawOne: vi.fn().mockResolvedValue({ total: "7" }),
    };
    countQueryBuilder.select.mockReturnValue(countQueryBuilder);
    countQueryBuilder.from.mockReturnValue(countQueryBuilder);
    countQueryBuilder.setParameters.mockReturnValue(countQueryBuilder);

    const repository = createRepository(
      listingQueryBuilder,
      countQueryBuilder,
    );

    await expect(
      repository.countSitemapVehicleListings({ variant: "catalog" }),
    ).resolves.toBe(7);

    expect(listingQueryBuilder.where).toHaveBeenCalledWith(
      "vehicle.status = :status",
      { status: STATUS_VEHICLE.ACTIVE },
    );
    expect(listingQueryBuilder.andWhere).toHaveBeenCalledWith(
      "vehicle.deleted_at IS NULL",
    );
    expect(listingQueryBuilder.andWhere).toHaveBeenCalledWith(
      "vehicle.version_id IS NOT NULL",
    );
    expect(listingQueryBuilder.groupBy).toHaveBeenCalledWith("cat_make.slug");
    expect(listingQueryBuilder.addGroupBy).toHaveBeenCalledWith(
      "cat_model.slug",
    );
  });

  it("añade join espacial y lat/lng para variant with-province", async () => {
    const listingQueryBuilder = createListingQueryBuilder();
    const countQueryBuilder = {
      select: vi.fn(),
      from: vi.fn(),
      setParameters: vi.fn(),
      getRawOne: vi.fn().mockResolvedValue({ total: "3" }),
    };
    countQueryBuilder.select.mockReturnValue(countQueryBuilder);
    countQueryBuilder.from.mockReturnValue(countQueryBuilder);
    countQueryBuilder.setParameters.mockReturnValue(countQueryBuilder);

    const repository = createRepository(
      listingQueryBuilder,
      countQueryBuilder,
    );

    await repository.countSitemapVehicleListings({ variant: "with-province" });

    expect(listingQueryBuilder.andWhere).toHaveBeenCalledWith(
      "vehicle.lat IS NOT NULL",
    );
    expect(listingQueryBuilder.andWhere).toHaveBeenCalledWith(
      "vehicle.lng IS NOT NULL",
    );
    expect(listingQueryBuilder.innerJoin).toHaveBeenCalledWith(
      "provinces",
      "province",
      expect.stringContaining("ST_Intersects"),
    );
    expect(listingQueryBuilder.addGroupBy).toHaveBeenCalledWith("province.slug");
  });

  it("pagina y mapea makeSlug/modelSlug en catalog", async () => {
    const listingQueryBuilder = createListingQueryBuilder();
    listingQueryBuilder.getRawMany.mockResolvedValue([
      { make_slug: "toyota", model_slug: "avensis" },
    ]);

    const countQueryBuilder = {
      select: vi.fn(),
      from: vi.fn(),
      setParameters: vi.fn(),
      getRawOne: vi.fn().mockResolvedValue({ total: "1" }),
    };
    countQueryBuilder.select.mockReturnValue(countQueryBuilder);
    countQueryBuilder.from.mockReturnValue(countQueryBuilder);
    countQueryBuilder.setParameters.mockReturnValue(countQueryBuilder);

    const repository = createRepository(
      listingQueryBuilder,
      countQueryBuilder,
    );

    const result = await repository.findSitemapVehicleListings({
      page: 2,
      limit: 1000,
      variant: "catalog",
    });

    expect(listingQueryBuilder.offset).toHaveBeenCalledWith(1000);
    expect(listingQueryBuilder.limit).toHaveBeenCalledWith(1000);
    expect(result).toEqual({
      data: [{ makeSlug: "toyota", modelSlug: "avensis" }],
      total: 1,
    });
  });

  it("incluye provinceSlug en with-province", async () => {
    const listingQueryBuilder = createListingQueryBuilder();
    listingQueryBuilder.getRawMany.mockResolvedValue([
      {
        make_slug: "toyota",
        model_slug: "avensis",
        province_slug: "tarragona",
      },
    ]);

    const countQueryBuilder = {
      select: vi.fn(),
      from: vi.fn(),
      setParameters: vi.fn(),
      getRawOne: vi.fn().mockResolvedValue({ total: "1" }),
    };
    countQueryBuilder.select.mockReturnValue(countQueryBuilder);
    countQueryBuilder.from.mockReturnValue(countQueryBuilder);
    countQueryBuilder.setParameters.mockReturnValue(countQueryBuilder);

    const repository = createRepository(
      listingQueryBuilder,
      countQueryBuilder,
    );

    const result = await repository.findSitemapVehicleListings({
      page: 1,
      limit: 5000,
      variant: "with-province",
    });

    expect(result.data[0]).toEqual({
      makeSlug: "toyota",
      modelSlug: "avensis",
      provinceSlug: "tarragona",
    });
  });
});
