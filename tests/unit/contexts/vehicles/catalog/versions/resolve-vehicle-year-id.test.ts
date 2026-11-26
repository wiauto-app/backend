import { vi } from "vitest";

import { resolveVehicleYearId } from "@/src/contexts/vehicles/catalog/versions/helpers/resolve-vehicle-year-id";
import { CatalogVersionsService } from "@/src/contexts/vehicles/catalog/versions/services/catalog-versions.service";
import { InvalidVehicleYearException } from "@/src/contexts/vehicles/exceptions/invalid-vehicle-year.exception";

const version = { id: 10, year_id: 2024 };

const pairs = (valid: Array<[number, number]>) =>
  vi.fn((version_id: number, year_id: number) =>
    Promise.resolve(
      valid.some(([v, y]) => v === version_id && y === year_id),
    ),
  );

describe("resolveVehicleYearId", () => {
  it("usa el año enviado cuando el par versión–año existe", async () => {
    const has_pair = pairs([[10, 2022]]);

    await expect(
      resolveVehicleYearId({ version, requested_year_id: 2022 }, has_pair),
    ).resolves.toBe(2022);
    expect(has_pair).toHaveBeenCalledWith(10, 2022);
  });

  it("responde 400 si el año enviado no corresponde a la versión", async () => {
    const has_pair = pairs([[10, 2022]]);

    const promise = resolveVehicleYearId(
      { version, requested_year_id: 2019 },
      has_pair,
    );

    await expect(promise).rejects.toBeInstanceOf(InvalidVehicleYearException);
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });

  it("sin año usa el año por defecto de la versión", async () => {
    const has_pair = pairs([]);

    await expect(resolveVehicleYearId({ version }, has_pair)).resolves.toBe(
      2024,
    );
    expect(has_pair).not.toHaveBeenCalled();
  });

  it("al cambiar de versión conserva el año actual si sigue siendo válido", async () => {
    const has_pair = pairs([[10, 2021]]);

    await expect(
      resolveVehicleYearId({ version, current_year_id: 2021 }, has_pair),
    ).resolves.toBe(2021);
  });

  it("al cambiar de versión usa el año por defecto si el actual ya no vale", async () => {
    const has_pair = pairs([[10, 2022]]);

    await expect(
      resolveVehicleYearId({ version, current_year_id: 2018 }, has_pair),
    ).resolves.toBe(2024);
  });

  it("el año enviado tiene prioridad sobre el actual", async () => {
    const has_pair = pairs([
      [10, 2021],
      [10, 2022],
    ]);

    await expect(
      resolveVehicleYearId(
        { version, requested_year_id: 2022, current_year_id: 2021 },
        has_pair,
      ),
    ).resolves.toBe(2022);
  });
});

describe("CatalogVersionsService.resolveVehicleYearId", () => {
  it("valida el par contra version_year vía el repositorio", async () => {
    const repository = { hasYear: vi.fn().mockResolvedValue(false) };
    const service = new CatalogVersionsService(repository as never);

    await expect(
      service.resolveVehicleYearId({ version, requested_year_id: 2019 }),
    ).rejects.toBeInstanceOf(InvalidVehicleYearException);
    expect(repository.hasYear).toHaveBeenCalledWith(10, 2019);
  });
});

describe("CatalogVersionsService admin CRUD", () => {
  const buildService = () => {
    const repository = {
      save: vi.fn((row: { id?: number; year_id: number }) =>
        Promise.resolve({ ...row, id: row.id ?? 99 }),
      ),
      findOne: vi.fn().mockResolvedValue({ id: 99, year_id: 2024, name: "x" }),
      addYears: vi.fn().mockResolvedValue(undefined),
    };
    return { repository, service: new CatalogVersionsService(repository as never) };
  };

  it("al crear guarda el año por defecto y los adicionales en version_year", async () => {
    const { repository, service } = buildService();

    await service.create({
      make_id: 1,
      model_id: 2,
      body_type_id: 3,
      fuel_type_id: 4,
      year_id: 2024,
      year_ids: [2022, 2023],
      name: "1.5 TSI",
    });

    expect(repository.addYears).toHaveBeenCalledWith(99, [2024, 2022, 2023]);
  });

  it("al editar con year_id añade el par", async () => {
    const { repository, service } = buildService();

    await service.update(99, { year_id: 2025 });

    expect(repository.addYears).toHaveBeenCalledWith(99, [2025]);
  });
});
