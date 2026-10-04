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

import { VehicleListFavoritesCacheService } from "@/src/contexts/vehicles/services/vehicle-list-favorites-cache.service";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";
import { List } from "@/src/contexts/vehicles/types/list";

describe("VehicleListsService.getFavoritesSnapshot", () => {
  it("devuelve listas y membresías agrupadas por vehicle_id", async () => {
    const vehicle_list_repository = {
      countByProfileId: vi.fn(),
      findAllByProfileId: vi.fn(),
      countByListIds: vi.fn(),
    };
    const vehicle_list_item_repository = {
      countByListIds: vi.fn().mockResolvedValue(new Map([["list-1", 2]])),
      findListVehiclePairsByProfileId: vi.fn().mockResolvedValue([
        { list_id: "list-1", vehicle_id: "veh-a" },
        { list_id: "list-2", vehicle_id: "veh-a" },
        { list_id: "list-1", vehicle_id: "veh-b" },
      ]),
    };
    const vehicle_repository = {};
    const favorites_cache = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn(),
    };

    vehicle_list_repository.findAllByProfileId.mockResolvedValue([
      {
        toPrimitives: () => ({
          id: "list-1",
          profile_id: "profile-1",
          is_default: true,
          name: "Favoritos",
          description: null,
          created_at: new Date("2026-01-01T00:00:00.000Z"),
        }),
      },
    ]);

    const service = new VehicleListsService(
      vehicle_list_repository as never,
      vehicle_list_item_repository as never,
      vehicle_repository as never,
      favorites_cache as never,
    );

    vi.spyOn(service, "findAll").mockResolvedValue([
      {
        id: "list-1",
        profile_id: "profile-1",
        is_default: true,
        name: "Favoritos",
        description: null,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        item_count: 2,
      },
    ]);

    const snapshot = await service.getFavoritesSnapshot("profile-1");

    expect(snapshot.lists).toHaveLength(1);
    expect(snapshot.memberships).toEqual([
      { vehicle_id: "veh-a", list_ids: ["list-1", "list-2"] },
      { vehicle_id: "veh-b", list_ids: ["list-1"] },
    ]);
    expect(favorites_cache.set).toHaveBeenCalledWith("profile-1", snapshot);
  });

  it("reutiliza la caché cuando existe", async () => {
    const cached = {
      lists: [],
      memberships: [{ vehicle_id: "veh-a", list_ids: ["list-1"] }],
    };
    const favorites_cache = {
      get: vi.fn().mockResolvedValue(cached),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    const service = new VehicleListsService(
      {} as never,
      {} as never,
      {} as never,
      favorites_cache as never,
    );

    const snapshot = await service.getFavoritesSnapshot("profile-1");

    expect(snapshot).toBe(cached);
    expect(favorites_cache.set).not.toHaveBeenCalled();
  });
});

describe("VehicleListFavoritesCacheService", () => {
  it("guarda en favorites:{id} con TTL de 15 minutos y borra esa clave", async () => {
    const cache_manager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    const service = new VehicleListFavoritesCacheService(
      cache_manager as never,
    );
    const snapshot = { lists: [], memberships: [] };

    await service.set("user-1", snapshot);
    await service.invalidate("user-1");

    expect(cache_manager.set).toHaveBeenCalledWith(
      "favorites:user-1",
      snapshot,
      15 * 60 * 1000,
    );
    expect(cache_manager.del).toHaveBeenCalledWith("favorites:user-1");
  });
});

describe("VehicleListsService invalidación de favoritos", () => {
  const profile_id = "profile-1";

  const owned_list = () =>
    List.fromPrimitives({
      id: "list-1",
      profile_id,
      is_default: false,
      name: "Comparar",
      description: null,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
    });

  it("invalida después de guardar la lista y no si el guardado falla", async () => {
    const order: string[] = [];
    const favorites_cache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(async () => {
        order.push("invalidate");
      }),
    };
    const save = vi.fn(async () => {
      order.push("save");
    });
    const service = new VehicleListsService(
      {
        countByProfileId: vi.fn().mockResolvedValue(1),
        save,
      } as never,
      {} as never,
      {} as never,
      favorites_cache as never,
    );

    await service.create({ profile_id, name: "Comparar" });

    expect(order).toEqual(["save", "invalidate"]);
    expect(favorites_cache.invalidate).toHaveBeenCalledWith(profile_id);

    save.mockRejectedValueOnce(new Error("db"));
    await expect(
      service.create({ profile_id, name: "Otra" }),
    ).rejects.toThrow("db");
    expect(favorites_cache.invalidate).toHaveBeenCalledTimes(1);
  });

  it("no invalida un update de una lista ajena", async () => {
    const favorites_cache = { invalidate: vi.fn() };
    const service = new VehicleListsService(
      {
        findOne: vi.fn().mockResolvedValue(
          List.fromPrimitives({
            ...owned_list().toPrimitives(),
            profile_id: "otro",
          }),
        ),
        update: vi.fn(),
      } as never,
      {} as never,
      {} as never,
      favorites_cache as never,
    );

    await expect(
      service.update({ list_id: "list-1", profile_id, name: "Nuevo" }),
    ).rejects.toThrow();
    expect(favorites_cache.invalidate).not.toHaveBeenCalled();
  });

  it("invalida al añadir y al quitar un vehículo, y no si el ítem no existe", async () => {
    const favorites_cache = { invalidate: vi.fn() };
    const add = vi.fn().mockResolvedValue(undefined);
    const remove = vi.fn().mockRejectedValue(new Error("missing"));
    const service = new VehicleListsService(
      { findOne: vi.fn().mockResolvedValue(owned_list()) } as never,
      {
        exists: vi.fn().mockResolvedValue(false),
        add,
        remove,
      } as never,
      { findOne: vi.fn().mockResolvedValue({ id: "veh-a" }) } as never,
      favorites_cache as never,
    );

    await service.addItem({
      list_id: "list-1",
      profile_id,
      vehicle_id: "veh-a",
    });
    expect(favorites_cache.invalidate).toHaveBeenCalledTimes(1);
    expect(favorites_cache.invalidate).toHaveBeenCalledWith(profile_id);

    await expect(
      service.removeItem({
        list_id: "list-1",
        profile_id,
        vehicle_id: "veh-a",
      }),
    ).rejects.toThrow("missing");
    expect(favorites_cache.invalidate).toHaveBeenCalledTimes(1);
  });
});
