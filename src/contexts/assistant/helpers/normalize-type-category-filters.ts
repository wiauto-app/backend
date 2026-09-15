import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import type { AssistantIntent } from "../types/assistant-intent";

const normalizeForMatch = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

const uniqueSlugs = (slugs: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const slug of slugs) {
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    result.push(slug);
  }

  return result;
};

const findVehicleTypeSlug = (
  text: string,
  catalog: AssistantFilterCatalog,
): string | undefined => {
  const query = text.trim();
  if (!query) {
    return undefined;
  }

  const slugified = slugify(query);
  const normalizedQuery = normalizeForMatch(query);

  const bySlug = catalog.vehicleTypes.find((item) => item.slug === slugified);
  if (bySlug) {
    return bySlug.slug;
  }

  const byName = catalog.vehicleTypes.find(
    (item) => normalizeForMatch(item.name) === normalizedQuery,
  );
  if (byName) {
    return byName.slug;
  }

  return undefined;
};

const findCategorySlug = (
  text: string,
  catalog: AssistantFilterCatalog,
): string | undefined => {
  const query = text.trim();
  if (!query) {
    return undefined;
  }

  const slugified = slugify(query);
  const normalizedQuery = normalizeForMatch(query);

  const byExactSlug = catalog.categories.find((item) => item.slug === slugified);
  if (byExactSlug) {
    return byExactSlug.slug;
  }

  const byExactName = catalog.categories.find(
    (item) => normalizeForMatch(item.name) === normalizedQuery,
  );
  if (byExactName) {
    return byExactName.slug;
  }

  const byPrefix = catalog.categories.find(
    (item) =>
      item.slug === slugified ||
      item.slug.startsWith(`${slugified}-`) ||
      item.slug.includes(`-${slugified}-`) ||
      item.slug.endsWith(`-${slugified}`),
  );
  if (byPrefix) {
    return byPrefix.slug;
  }

  const byNameIncludes = catalog.categories.find((item) => {
    const normalizedName = normalizeForMatch(item.name);
    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedName)
    );
  });

  return byNameIncludes?.slug;
};

/**
 * Corrige confusión tipo vs categoría:
 * - `vehicleTypes` = coche, furgoneta, camión…
 * - `categories` = suv-y-todoterrenos, pick-up, monovolúmenes…
 */
export const normalizeTypeCategoryFilters = (
  filters: SearchVehiclesInput,
  catalog: AssistantFilterCatalog,
  intent?: AssistantIntent,
): SearchVehiclesInput => {
  const next: SearchVehiclesInput = { ...filters };
  const typeSlugs = new Set(catalog.vehicleTypes.map((item) => item.slug));
  const categorySlugs = new Set(catalog.categories.map((item) => item.slug));

  if (next.type_slug && !typeSlugs.has(next.type_slug)) {
    if (categorySlugs.has(next.type_slug)) {
      next.categories_slugs = uniqueSlugs([
        ...(next.categories_slugs ?? []),
        next.type_slug,
      ]);
    } else {
      const asCategory = findCategorySlug(next.type_slug, catalog);
      if (asCategory) {
        next.categories_slugs = uniqueSlugs([
          ...(next.categories_slugs ?? []),
          asCategory,
        ]);
      }
    }
    delete next.type_slug;
  }

  if (
    intent?.vehicle_type &&
    !next.type_slug &&
    !(next.categories_slugs && next.categories_slugs.length > 0)
  ) {
    const asType = findVehicleTypeSlug(intent.vehicle_type, catalog);
    if (asType) {
      next.type_slug = asType;
    } else {
      const asCategory = findCategorySlug(intent.vehicle_type, catalog);
      if (asCategory) {
        next.categories_slugs = [asCategory];
      }
    }
  }

  if (next.categories_slugs?.length) {
    next.categories_slugs = uniqueSlugs(
      next.categories_slugs.filter((slug) => categorySlugs.has(slug)),
    );
    if (next.categories_slugs.length === 0) {
      delete next.categories_slugs;
    }
  }

  return next;
};
