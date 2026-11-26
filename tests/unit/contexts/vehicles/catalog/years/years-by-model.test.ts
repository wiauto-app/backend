import { FindOperator } from "typeorm";
import { vi } from "vitest";

import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { TypeormCatalogYearRepository } from "@/src/contexts/vehicles/catalog/years/repositories/typeorm.catalog-year-repository";

const buildQueryBuilder = (year_ids: number[]) => {
  const qb = {
    innerJoin: vi.fn(),
    select: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    getRawMany: vi
      .fn()
      .mockResolvedValue(year_ids.map((year_id) => ({ year_id: String(year_id) }))),
  };
  qb.innerJoin.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
};

const buildRepository = (year_ids: number[]) => {
  const qb = buildQueryBuilder(year_ids);
  const year_orm = {
    findAndCount: vi.fn().mockResolvedValue([
      [{ id: 1, year: 2022, slug: "2022", created_at: new Date() }],
      1,
    ]),
  };
  const version_year_orm = { createQueryBuilder: vi.fn(() => qb) };
  return {
    qb,
    year_orm,
    repository: new TypeormCatalogYearRepository(
      year_orm as never,
      version_year_orm as never,
    ),
  };
};

describe("TypeormCatalogYearRepository.find_all por modelo", () => {
  it("devuelve lista vacía si el modelo no tiene versiones", async () => {
    const { year_orm, repository } = buildRepository([]);

    const result = await repository.find_all(
      new CatalogPaginationFilter({ model_id: 7 }),
    );

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(year_orm.findAndCount).not.toHaveBeenCalled();
  });

  it("filtra por los años de version_year del modelo", async () => {
    const { qb, year_orm, repository } = buildRepository([3, 5]);

    await repository.find_all(new CatalogPaginationFilter({ model_id: 7 }));

    expect(qb.where).toHaveBeenCalledWith("version.model_id = :model_id", {
      model_id: 7,
    });
    const where = year_orm.findAndCount.mock.calls[0][0].where as {
      id: FindOperator<number[]>;
    };
    expect(where.id.type).toBe("in");
    expect(where.id.value).toEqual([3, 5]);
  });

  it("aplica carrocería y combustible opcionales", async () => {
    const { qb, repository } = buildRepository([3]);

    await repository.find_all(
      new CatalogPaginationFilter({
        model_id: 7,
        body_type_id: 2,
        fuel_type_id: 4,
      }),
    );

    expect(qb.andWhere).toHaveBeenCalledWith(
      "version.body_type_id = :body_type_id",
      { body_type_id: 2 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      "version.fuel_type_id = :fuel_type_id",
      { fuel_type_id: 4 },
    );
  });

  it("sin modelo lista todos los años", async () => {
    const { qb, year_orm, repository } = buildRepository([]);

    await repository.find_all(new CatalogPaginationFilter({}));

    expect(qb.getRawMany).not.toHaveBeenCalled();
    expect(year_orm.findAndCount.mock.calls[0][0]).not.toHaveProperty("where");
  });
});
