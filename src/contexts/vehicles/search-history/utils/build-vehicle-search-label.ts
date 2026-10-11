import {
  CONDITION_VEHICLE,
  ConditionVehicle,
  PUBLISHER_TYPE,
  PublisherType,
  TRANSMISSION_TYPE,
  TransmissionType,
} from "../../types/vehicle";
import type {
  VehicleSearchQuery,
  VehicleSearchQueryKey,
} from "../types/vehicle-search-query";
import { countVehicleSearchFilters } from "./normalize-vehicle-search-query";

/** Nombres legibles resueltos desde los slugs de la búsqueda. */
export interface VehicleSearchLabelNames {
  vehicle_type: string | null;
  makes: string[];
  models: string[];
  categories: string[];
  fuels: string[];
  locations: string[];
}

export const EMPTY_VEHICLE_SEARCH_LABEL_NAMES: VehicleSearchLabelNames = {
  vehicle_type: null,
  makes: [],
  models: [],
  categories: [],
  fuels: [],
  locations: [],
};

export const VEHICLE_SEARCH_LABEL_MAX_LENGTH = 255;
const LABEL_SEPARATOR = " · ";
const DEFAULT_LABEL = "Búsqueda de vehículos";

const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  [TRANSMISSION_TYPE.MANUAL]: "Manual",
  [TRANSMISSION_TYPE.AUTOMATIC]: "Automático",
};

const CONDITION_LABELS: Record<ConditionVehicle, string> = {
  [CONDITION_VEHICLE["0KM"]]: "Km 0",
  [CONDITION_VEHICLE.NEW]: "Nuevo",
  [CONDITION_VEHICLE.USED]: "Usado",
};

const PUBLISHER_LABELS: Record<PublisherType, string> = {
  [PUBLISHER_TYPE.PARTICULAR]: "Particulares",
  [PUBLISHER_TYPE.DEALERSHIP]: "Concesionarios",
};

/** Claves que el label muestra explícitamente; el resto suma en "+N filtros". */
const LABELED_KEYS = new Set<VehicleSearchQueryKey>([
  "query",
  "type_slug",
  "makes_slugs",
  "models_slugs",
  "categories_slugs",
  "since_year",
  "until_year",
  "fuel_type_slugs",
  "transmission_types",
  "since_price",
  "until_price",
  "since_mileage",
  "until_mileage",
  "condition",
  "provinces_slugs",
  "comunities_slugs",
  "municipalities_slugs",
  "lat",
  "lng",
  "radius",
  "publisher_types",
]);

/** Separador de miles siempre (Intl es-ES no agrupa números de 4 cifras). */
export const formatSpanishNumber = (value: number): string =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const formatRange = (
  since: number | undefined,
  until: number | undefined,
  format: (value: number) => string,
  unit = "",
): string | null => {
  const suffix = unit ? ` ${unit}` : "";
  if (since !== undefined && until !== undefined) {
    return `${format(since)}-${format(until)}${suffix}`;
  }
  if (since !== undefined) {
    return `desde ${format(since)}${suffix}`;
  }
  if (until !== undefined) {
    return `hasta ${format(until)}${suffix}`;
  }
  return null;
};

const joinList = (items: string[]): string | null => {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : null;
};

/** Fallback cuando el slug no se resolvió: "serie-3" → "Serie 3". */
export const humanizeSlug = (slug: string): string => {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const truncate = (value: string): string =>
  value.length <= VEHICLE_SEARCH_LABEL_MAX_LENGTH
    ? value
    : `${value.slice(0, VEHICLE_SEARCH_LABEL_MAX_LENGTH - 1).trimEnd()}…`;

/**
 * Resumen legible de una búsqueda, p. ej.
 * "BMW Serie 3 · 2018-2022 · Diésel · hasta 30.000 €".
 */
export const buildVehicleSearchLabel = (
  query: VehicleSearchQuery,
  names: VehicleSearchLabelNames = EMPTY_VEHICLE_SEARCH_LABEL_NAMES,
): string => {
  const parts: string[] = [];
  const push = (part: string | null): void => {
    if (part) {
      parts.push(part);
    }
  };

  const makes = names.makes.length > 0
    ? names.makes
    : (query.makes_slugs ?? []).map((slug) => humanizeSlug(slug));
  const models = names.models.length > 0
    ? names.models
    : (query.models_slugs ?? []).map((slug) => humanizeSlug(slug));
  const make_model = [joinList(makes), joinList(models)]
    .filter(Boolean)
    .join(" ");
  push(make_model || null);

  if (!make_model) {
    push(
      names.vehicle_type ??
        (query.type_slug ? humanizeSlug(query.type_slug) : null),
    );
  }

  push(
    joinList(
      names.categories.length > 0
        ? names.categories
        : (query.categories_slugs ?? []).map((slug) => humanizeSlug(slug)),
    ),
  );

  if (query.query) {
    push(`"${query.query}"`);
  }

  push(formatRange(query.since_year, query.until_year, String));

  push(
    joinList(
      names.fuels.length > 0
        ? names.fuels
        : (query.fuel_type_slugs ?? []).map((slug) => humanizeSlug(slug)),
    ),
  );

  push(
    joinList(
      (query.transmission_types ?? []).map(
        (type) => TRANSMISSION_LABELS[type],
      ),
    ),
  );

  push(
    formatRange(query.since_price, query.until_price, formatSpanishNumber, "€"),
  );
  push(
    formatRange(
      query.since_mileage,
      query.until_mileage,
      formatSpanishNumber,
      "km",
    ),
  );

  if (query.condition) {
    push(CONDITION_LABELS[query.condition]);
  }

  const location_slugs = [
    ...(query.municipalities_slugs ?? []),
    ...(query.provinces_slugs ?? []),
    ...(query.comunities_slugs ?? []),
  ];
  push(
    joinList(
      names.locations.length > 0
        ? names.locations
        : location_slugs.map((slug) => humanizeSlug(slug)),
    ),
  );

  if (query.radius !== undefined) {
    push(`a ${formatSpanishNumber(query.radius / 1000)} km`);
  }

  push(
    joinList(
      (query.publisher_types ?? []).map(
        (type) => PUBLISHER_LABELS[type],
      ),
    ),
  );

  const unlabeled_query = Object.fromEntries(
    Object.entries(query).filter(
      ([key]) => !LABELED_KEYS.has(key as VehicleSearchQueryKey),
    ),
  ) as VehicleSearchQuery;
  const extra_filters = countVehicleSearchFilters(unlabeled_query);
  if (extra_filters > 0) {
    push(`+${extra_filters} ${extra_filters === 1 ? "filtro" : "filtros"}`);
  }

  if (parts.length === 0) {
    return DEFAULT_LABEL;
  }

  return truncate(parts.join(LABEL_SEPARATOR));
};
