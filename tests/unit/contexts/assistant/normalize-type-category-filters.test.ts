import { describe, expect, it } from "vitest";

import { normalizeTypeCategoryFilters } from "@/src/contexts/assistant/helpers/normalize-type-category-filters";
import type { AssistantFilterCatalog } from "@/src/contexts/assistant/types/assistant-filter-catalog";

const catalog: AssistantFilterCatalog = {
  vehicleTypes: [
    { id: "1", slug: "coche", name: "Coche" },
    { id: "2", slug: "furgoneta", name: "Furgoneta" },
  ],
  categories: [
    {
      id: "c1",
      slug: "suv-y-todoterrenos",
      name: "SUV y todoterrenos",
      image_url: null,
    },
    {
      id: "c2",
      slug: "pick-up",
      name: "Pick-up",
      image_url: null,
    },
  ],
  colors: [],
  features: [],
  services: [],
  cuotas: [],
  tractions: [],
  warranties: [],
  dgtLabels: [],
  fuels: [],
};

describe("normalizeTypeCategoryFilters", () => {
  it("mueve un slug de categoría fuera de type_slug", () => {
    const result = normalizeTypeCategoryFilters(
      { type_slug: "suv-y-todoterrenos" },
      catalog,
    );

    expect(result.type_slug).toBeUndefined();
    expect(result.categories_slugs).toEqual(["suv-y-todoterrenos"]);
  });

  it("resuelve vehicle_type SUV a categoría cuando no hay filtros", () => {
    const result = normalizeTypeCategoryFilters(
      {},
      catalog,
      { vehicle_type: "SUV" },
    );

    expect(result.type_slug).toBeUndefined();
    expect(result.categories_slugs).toEqual(["suv-y-todoterrenos"]);
  });

  it("resuelve vehicle_type furgoneta a type_slug", () => {
    const result = normalizeTypeCategoryFilters(
      {},
      catalog,
      { vehicle_type: "furgoneta" },
    );

    expect(result.type_slug).toBe("furgoneta");
    expect(result.categories_slugs).toBeUndefined();
  });

  it("conserva type_slug válido de vehicleTypes", () => {
    const result = normalizeTypeCategoryFilters(
      { type_slug: "coche" },
      catalog,
    );

    expect(result.type_slug).toBe("coche");
  });
});
