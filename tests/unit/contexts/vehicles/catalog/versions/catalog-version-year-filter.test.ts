import { FindOperator } from "typeorm";
import { vi } from "vitest";

import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { TypeormCatalogVersionRepository } from "@/src/contexts/vehicles/catalog/versions/repositories/typeorm.catalog-version-repository";

interface FindAndCountArgs {
  where?: Record<string, unknown>;
  relations?: string[];
}

const buildRepository = (rows: unknown[] = []) => {
  const orm = {
    findAndCount: vi.fn((_args: FindAndCountArgs) =>
      Promise.resolve([rows, rows.length]),
    ),
  };
  return { orm, repository: new TypeormCatalogVersionRepository(orm as never) };
};

describe("TypeormCatalogVersionRepository.findAll year filter", () => {
  it("filtra por año con EXISTS sobre version_year, no por version.year_id", async () => {
    const { orm, repository } = buildRepository();

    await repository.findAll(
      new CatalogPaginationFilter({ model_id: 5, year_id: 2022 }),
    );

    const args = orm.findAndCount.mock.calls[0][0];
    expect(args.where?.model_id).toBe(5);
    expect(args.where).not.toHaveProperty("year_id");

    const id_filter = args.where?.id as FindOperator<number>;
    expect(id_filter).toBeInstanceOf(FindOperator);
    expect(id_filter.type).toBe("raw");
    const sql = id_filter.getSql?.('"version"."id"') ?? "";
    expect(sql).toContain("EXISTS");
    expect(sql).toContain("version_year");
    expect(sql).toContain('vy.version_id = "version"."id"');
    expect(id_filter.objectLiteralParameters).toEqual({ year_id: 2022 });
  });

  it("sin año no agrega filtro por id", async () => {
    const { orm, repository } = buildRepository();

    await repository.findAll(new CatalogPaginationFilter({ model_id: 5 }));

    const args = orm.findAndCount.mock.calls[0][0];
    expect(args.where).not.toHaveProperty("id");
  });

  it("devuelve los años de cada versión ordenados", async () => {
    const { orm, repository } = buildRepository([
      {
        id: 1,
        years: [
          { id: 3, year: 2023 },
          { id: 1, year: 2021 },
        ],
      },
    ]);

    const result = await repository.findAll(new CatalogPaginationFilter({}));

    expect(orm.findAndCount.mock.calls[0][0].relations).toEqual([
      "year",
      "years",
      "fuel_type",
      "body_type",
    ]);
    expect(result.data[0].years.map((year) => year.year)).toEqual([
      2021, 2023,
    ]);
  });
});
