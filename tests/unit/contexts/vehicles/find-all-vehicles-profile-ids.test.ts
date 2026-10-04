import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it, vi } from "vitest";

import { FindAllVehiclesHttpDto } from "@/src/contexts/vehicles/api/v1/find-all-vehicles/find-all-vehicles.http-dto";
import { VehicleFilter } from "@/src/contexts/vehicles/types/vehicle.filter";
import { applyFilters } from "@/src/contexts/vehicles/validators/filters.applier";

const PROFILE_ID = "3f2b8c1e-4d5a-4b6c-9e7f-1a2b3c4d5e6f";

const createQueryBuilder = () => {
  const qb = {
    andWhere: vi.fn(),
    leftJoin: vi.fn(),
    innerJoin: vi.fn(),
  };
  qb.andWhere.mockReturnValue(qb);
  qb.leftJoin.mockReturnValue(qb);
  qb.innerJoin.mockReturnValue(qb);
  return qb;
};

describe("filtro profile_ids en GET /v1/vehicles", () => {
  it("filtra por vehicle.profile_id cuando llegan perfiles", () => {
    const qb = createQueryBuilder();

    applyFilters(qb as never, new VehicleFilter({ profile_ids: [PROFILE_ID] }));

    expect(qb.andWhere).toHaveBeenCalledWith(
      "vehicle.profile_id IN (:...profile_ids)",
      { profile_ids: [PROFILE_ID] },
    );
  });

  it("no filtra por perfil si la lista está vacía", () => {
    const qb = createQueryBuilder();

    applyFilters(qb as never, new VehicleFilter({ profile_ids: [] }));

    const conditions = qb.andWhere.mock.calls.map(([condition]) => condition);
    expect(conditions).not.toContain("vehicle.profile_id IN (:...profile_ids)");
  });

  it("acepta un UUID y rechaza valores que no lo son", async () => {
    const valid = plainToInstance(FindAllVehiclesHttpDto, {
      profile_ids: PROFILE_ID,
    });
    const invalid = plainToInstance(FindAllVehiclesHttpDto, {
      profile_ids: "no-es-uuid",
    });

    const valid_errors = await validate(valid);
    const invalid_errors = await validate(invalid);

    expect(valid.profile_ids).toEqual([PROFILE_ID]);
    expect(valid_errors.find((error) => error.property === "profile_ids")).toBeUndefined();
    expect(invalid_errors.find((error) => error.property === "profile_ids")).toBeDefined();
  });
});
