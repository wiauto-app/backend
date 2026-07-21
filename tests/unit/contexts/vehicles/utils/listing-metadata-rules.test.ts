import { describe, expect, it } from "vitest";
import { buildListingMetadata } from "./src/contexts/vehicles/utils/listing-metadata-rules";
import type { ActiveFiltersResolved } from "./src/contexts/vehicles/types/active-filters-response";

const empty = (): ActiveFiltersResolved => ({
  vehicle_type: null,
  makes: [],
  models: [],
  categories: [],
  provinces: [],
  communities: [],
  municipalities: [],
  services: [],
  warranties: [],
  colors: [],
  dgt_labels: [],
  features: [],
  fuels: [],
  tractions: [],
  cuotas: [],
});

describe("buildListingMetadata", () => {
  it("sin filtros", () => {
    expect(buildListingMetadata(empty(), {}).h1).toBe("Coches de ocasión");
  });

  it("solo marca", () => {
    const resolved = empty();
    resolved.makes = [{ id: 1, slug: "toyota", name: "Toyota" }];
    expect(buildListingMetadata(resolved, {}).h1).toBe("Toyota de ocasión");
  });

  it("marca + modelo + provincia", () => {
    const resolved = empty();
    resolved.makes = [{ id: 1, slug: "toyota", name: "Toyota" }];
    resolved.models = [{ id: 10, slug: "corolla", name: "Corolla", make_id: 1 }];
    resolved.provinces = [{ id: 28, slug: "madrid", name: "Madrid" }];
    expect(buildListingMetadata(resolved, {}).h1).toBe(
      "Toyota Corolla de ocasión en Madrid",
    );
  });

  it("tipo + marca + modelo + precio", () => {
    const resolved = empty();
    resolved.vehicle_type = { id: "1", slug: "suv", name: "SUV" };
    resolved.makes = [{ id: 1, slug: "toyota", name: "Toyota" }];
    resolved.models = [{ id: 10, slug: "corolla", name: "Corolla", make_id: 1 }];
    resolved.provinces = [{ id: 28, slug: "madrid", name: "Madrid" }];
    const result = buildListingMetadata(resolved, {
      since_price: 5000,
      until_price: 30000,
    });
    expect(result.h1).toBe("SUV Toyota Corolla de ocasión en Madrid");
    expect(result.title).toContain("| WiAuto");
    expect(result.parts.modifiers[0]).toContain("€");
  });

  it("2 marcas", () => {
    const resolved = empty();
    resolved.makes = [
      { id: 1, slug: "toyota", name: "Toyota" },
      { id: 2, slug: "ford", name: "Ford" },
    ];
    expect(buildListingMetadata(resolved, {}).h1).toBe(
      "Toyota y Ford de ocasión",
    );
  });

  it(">2 marcas", () => {
    const resolved = empty();
    resolved.makes = [
      { id: 1, slug: "toyota", name: "Toyota" },
      { id: 2, slug: "ford", name: "Ford" },
      { id: 3, slug: "bmw", name: "BMW" },
    ];
    expect(buildListingMetadata(resolved, {}).h1).toBe(
      "Coches de varias marcas de ocasión",
    );
  });

  it("varios modelos", () => {
    const resolved = empty();
    resolved.makes = [{ id: 1, slug: "toyota", name: "Toyota" }];
    resolved.models = [
      { id: 10, slug: "corolla", name: "Corolla", make_id: 1 },
      { id: 11, slug: "yaris", name: "Yaris", make_id: 1 },
      { id: 12, slug: "rav4", name: "RAV4", make_id: 1 },
    ];
    expect(buildListingMetadata(resolved, {}).h1).toBe(
      "Toyota (Corolla, Yaris y más) de ocasión",
    );
  });
});
