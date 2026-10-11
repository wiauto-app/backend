import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { FindAllVehiclesHttpDto } from "@/src/contexts/vehicles/api/v1/find-all-vehicles/find-all-vehicles.http-dto";
import {
  buildVehicleSearchLabel,
  formatSpanishNumber,
} from "@/src/contexts/vehicles/search-history/utils/build-vehicle-search-label";
import {
  countVehicleSearchFilters,
  hashVehicleSearchQuery,
  isRecordableVehicleSearch,
  isSearchRecordingRequested,
  normalizeVehicleSearchQuery,
} from "@/src/contexts/vehicles/search-history/utils/normalize-vehicle-search-query";

describe("normalizeVehicleSearchQuery", () => {
  it("descarta paginación, orden, vacíos y parámetros de contexto", () => {
    const query = normalizeVehicleSearchQuery({
      page: 1,
      limit: 20,
      order_by: "price",
      order_direction: "ASC",
      search: "ignorado",
      exclude_vehicle_ids: ["a"],
      makes_slugs: ["bmw"],
      models_slugs: [],
      type_slug: "  ",
      until_price: 30_000,
      since_price: undefined,
    });

    expect(query).toEqual({ makes_slugs: ["bmw"], until_price: 30_000 });
  });

  it("ordena claves y arrays, y deduplica", () => {
    const query = normalizeVehicleSearchQuery({
      models_slugs: ["serie-5", "serie-3", "serie-3"],
      makes_slugs: ["bmw"],
    });

    expect(Object.keys(query)).toEqual(["makes_slugs", "models_slugs"]);
    expect(query.models_slugs).toEqual(["serie-3", "serie-5"]);
  });

  it("conserva booleanos false porque cambian el filtro", () => {
    expect(
      normalizeVehicleSearchQuery({ is_seller_featured: false }),
    ).toEqual({ is_seller_featured: false });
  });

  it("solo guarda lat/lng con radio y redondea coordenadas", () => {
    expect(normalizeVehicleSearchQuery({ lat: 40.4168, lng: -3.7038 })).toEqual(
      {},
    );
    expect(
      normalizeVehicleSearchQuery({
        lat: 40.416_812,
        lng: -3.703_812,
        radius: 50_000,
      }),
    ).toEqual({ lat: 40.417, lng: -3.704, radius: 50_000 });
  });

  it("normaliza el texto libre", () => {
    expect(normalizeVehicleSearchQuery({ query: "  Golf   GTI " })).toEqual({
      query: "golf gti",
    });
  });

  it("funciona con el DTO transformado del listado", () => {
    const dto = plainToInstance(FindAllVehiclesHttpDto, {
      makes_slugs: "bmw,audi",
      since_year: "2018",
    });

    expect(normalizeVehicleSearchQuery(dto)).toEqual({
      makes_slugs: ["audi", "bmw"],
      since_year: 2018,
    });
  });
});

describe("hashVehicleSearchQuery", () => {
  it("es estable ante el orden de claves y de arrays", () => {
    const a = normalizeVehicleSearchQuery({
      makes_slugs: ["bmw", "audi"],
      until_price: 30_000,
    });
    const b = normalizeVehicleSearchQuery({
      until_price: 30_000,
      makes_slugs: ["audi", "bmw"],
      order_by: "price",
      page: 1,
    });

    expect(hashVehicleSearchQuery(a)).toBe(hashVehicleSearchQuery(b));
    expect(hashVehicleSearchQuery(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("cambia si cambian los filtros", () => {
    expect(hashVehicleSearchQuery({ makes_slugs: ["bmw"] })).not.toBe(
      hashVehicleSearchQuery({ makes_slugs: ["audi"] }),
    );
  });
});

describe("countVehicleSearchFilters", () => {
  it("cuenta rangos y radio como un único filtro", () => {
    expect(
      countVehicleSearchFilters({
        makes_slugs: ["bmw"],
        since_year: 2018,
        until_year: 2022,
        lat: 1,
        lng: 1,
        radius: 1000,
      }),
    ).toBe(3);
  });
});

describe("isRecordableVehicleSearch", () => {
  it("solo registra la primera página con filtros", () => {
    const query = { makes_slugs: ["bmw"] };
    expect(isRecordableVehicleSearch({ params: { page: 1 }, query })).toBe(true);
    expect(isRecordableVehicleSearch({ params: { page: 2 }, query })).toBe(false);
    expect(isRecordableVehicleSearch({ params: { page: 1 }, query: {} })).toBe(
      false,
    );
  });

  it("no registra listados de escaparate de un vendedor", () => {
    const query = { makes_slugs: ["bmw"] };
    expect(
      isRecordableVehicleSearch({
        params: { page: 1, dealership_ids: ["d1"] },
        query,
      }),
    ).toBe(false);
    expect(
      isRecordableVehicleSearch({
        params: { page: 1, profile_ids: ["p1"] },
        query,
      }),
    ).toBe(false);
  });
});

describe("buildVehicleSearchLabel", () => {
  it("construye el resumen con nombres resueltos", () => {
    const label = buildVehicleSearchLabel(
      {
        makes_slugs: ["bmw"],
        models_slugs: ["serie-3"],
        since_year: 2018,
        until_year: 2022,
        fuel_type_slugs: ["diesel"],
        until_price: 30_000,
      },
      {
        vehicle_type: null,
        makes: ["BMW"],
        models: ["Serie 3"],
        categories: [],
        fuels: ["Diésel"],
        locations: [],
      },
    );

    expect(label).toBe("BMW Serie 3 · 2018-2022 · Diésel · hasta 30.000 €");
  });

  it("usa los slugs humanizados si no hay nombres", () => {
    expect(
      buildVehicleSearchLabel({
        makes_slugs: ["mercedes-benz"],
        since_mileage: 5000,
        condition: "used",
      }),
    ).toBe("Mercedes benz · desde 5.000 km · Usado");
  });

  it("resume los filtros no representados", () => {
    expect(
      buildVehicleSearchLabel({
        color_slugs: ["rojo"],
        power_since: 100,
        power_until: 200,
      }),
    ).toBe("+2 filtros");
  });
});

describe("formatSpanishNumber", () => {
  it("agrupa miles con punto", () => {
    expect(formatSpanishNumber(5000)).toBe("5.000");
    expect(formatSpanishNumber(1_234_567)).toBe("1.234.567");
    expect(formatSpanishNumber(950)).toBe("950");
  });
});

describe("isSearchRecordingRequested", () => {
  it("acepta 1 y true sin distinguir mayúsculas ni espacios", () => {
    expect(isSearchRecordingRequested("1")).toBe(true);
    expect(isSearchRecordingRequested("true")).toBe(true);
    expect(isSearchRecordingRequested(" TRUE ")).toBe(true);
    expect(isSearchRecordingRequested(["0", "1"])).toBe(true);
  });

  it("no registra sin header o con otros valores", () => {
    expect(isSearchRecordingRequested()).toBe(false);
    expect(isSearchRecordingRequested("")).toBe(false);
    expect(isSearchRecordingRequested("0")).toBe(false);
    expect(isSearchRecordingRequested("false")).toBe(false);
    expect(isSearchRecordingRequested("yes")).toBe(false);
  });
});
