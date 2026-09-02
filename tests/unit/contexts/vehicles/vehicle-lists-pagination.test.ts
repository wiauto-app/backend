import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {},
  }),
);

vi.mock("@/src/contexts/vehicles/entities/vehicle.entity", () => ({
  VehicleEntity: class VehicleEntity {},
}));

import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { VehicleListForbiddenException } from "@/src/contexts/vehicles/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "@/src/contexts/vehicles/exceptions/vehicle-list-not-found.exception";
import { TypeOrmVehicleListItemRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-list-item-repository";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";
import { List } from "@/src/contexts/vehicles/types/list";

const createList = (profileId = "profile-id"): List =>
  List.fromPrimitives({
    id: "list-id",
    profile_id: profileId,
    is_default: true,
    name: "Favoritos",
    description: null,
    created_at: new Date("2026-09-01T00:00:00.000Z"),
  });

describe("PaginationHttpDto para items de listas", () => {
  it("transforma page y limit y aplica los valores predeterminados", async () => {
    const defaults = plainToInstance(PaginationHttpDto, {});
    const custom = plainToInstance(PaginationHttpDto, {
      page: "3",
      limit: "25",
    });

    expect(await validate(defaults)).toHaveLength(0);
    expect(defaults.page).toBe(1);
    expect(defaults.limit).toBe(10);
    expect(await validate(custom)).toHaveLength(0);
    expect(custom.page).toBe(3);
    expect(custom.limit).toBe(25);
  });

  it.each([
    { page: "0", limit: "10", property: "page" },
    { page: "1", limit: "0", property: "limit" },
    { page: "1", limit: "101", property: "limit" },
  ])("rechaza límites fuera de rango: $property", async (input) => {
    const dto = plainToInstance(PaginationHttpDto, input);
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === input.property)).toBe(
      true,
    );
  });
});

describe("VehicleListsService.findItems", () => {
  it("rechaza acceder a una lista de otro perfil", async () => {
    const listRepository = {
      findOne: vi.fn().mockResolvedValue(createList("other-profile")),
    };
    const itemRepository = { findAllByListId: vi.fn() };
    const service = new VehicleListsService(
      listRepository as never,
      itemRepository as never,
      {} as never,
    );

    await expect(
      service.findItems({
        listId: "list-id",
        profileId: "profile-id",
        page: 1,
        limit: 10,
      }),
    ).rejects.toBeInstanceOf(VehicleListForbiddenException);
    expect(itemRepository.findAllByListId).not.toHaveBeenCalled();
  });

  it("rechaza una lista inexistente", async () => {
    const itemRepository = { findAllByListId: vi.fn() };
    const service = new VehicleListsService(
      { findOne: vi.fn().mockResolvedValue(null) } as never,
      itemRepository as never,
      {} as never,
    );

    await expect(
      service.findItems({
        listId: "missing-list",
        profileId: "profile-id",
        page: 1,
        limit: 10,
      }),
    ).rejects.toBeInstanceOf(VehicleListNotFoundException);
    expect(itemRepository.findAllByListId).not.toHaveBeenCalled();
  });

  it("delega la página y el límite después de validar ownership", async () => {
    const expected = { data: [], total: 0, page: 2, limit: 20 };
    const itemRepository = {
      findAllByListId: vi.fn().mockResolvedValue(expected),
    };
    const service = new VehicleListsService(
      { findOne: vi.fn().mockResolvedValue(createList()) } as never,
      itemRepository as never,
      {} as never,
    );

    await expect(
      service.findItems({
        listId: "list-id",
        profileId: "profile-id",
        page: 2,
        limit: 20,
      }),
    ).resolves.toBe(expected);
    expect(itemRepository.findAllByListId).toHaveBeenCalledWith(
      "list-id",
      2,
      20,
    );
  });
});

describe("VehicleListsService.findAll", () => {
  it("incluye item_count y usa cero para listas vacías", async () => {
    const secondList = List.fromPrimitives({
      ...createList().toPrimitives(),
      id: "empty-list-id",
      name: "Vacía",
    });
    const service = new VehicleListsService(
      {
        countByProfileId: vi.fn().mockResolvedValue(2),
        findAllByProfileId: vi
          .fn()
          .mockResolvedValue([createList(), secondList]),
      } as never,
      {
        countByListIds: vi
          .fn()
          .mockResolvedValue(new Map([["list-id", 7]])),
      } as never,
      {} as never,
    );

    const result = await service.findAll("profile-id");

    expect(result.map(({ id, item_count: itemCount }) => ({ id, itemCount })))
      .toEqual([
        { id: "list-id", itemCount: 7 },
        { id: "empty-list-id", itemCount: 0 },
      ]);
  });
});

describe("TypeOrmVehicleListItemRepository.findAllByListId", () => {
  it("aplica skip/take, conserva el orden y devuelve total en una página vacía", async () => {
    const queryBuilder = {
      leftJoinAndSelect: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      skip: vi.fn(),
      take: vi.fn(),
      getManyAndCount: vi.fn().mockResolvedValue([[], 12]),
    };
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    const repository = new TypeOrmVehicleListItemRepository(
      { createQueryBuilder: vi.fn().mockReturnValue(queryBuilder) } as never,
      {} as never,
    );

    const result = await repository.findAllByListId("list-id", 3, 10);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      "item.list_id = :listId",
      { listId: "list-id" },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "item.created_at",
      "DESC",
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(12);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });
});
