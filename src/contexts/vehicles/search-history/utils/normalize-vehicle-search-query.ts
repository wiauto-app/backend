import { createHash } from "node:crypto";

import type {
  VehicleSearchQuery,
  VehicleSearchQueryKey,
} from "../types/vehicle-search-query";

type SearchParamKind = "string" | "text" | "string_array" | "number" | "boolean";

/**
 * Lista blanca de query params de GET /v1/vehicles que definen una búsqueda.
 * Excluidos a propósito:
 * - `page`, `limit`: paginación.
 * - `order_by`, `order_direction`: el orden no cambia el conjunto de resultados;
 *   guardarlo duplicaría la misma búsqueda por cada orden elegido.
 * - `search`: no lo aplica el filtro del listado (el texto libre es `query`).
 * - `exclude_vehicle_ids`: ruido de UI (carruseles, descartados).
 * - `dealership_ids`, `profile_ids`: listados de escaparate de un vendedor; si
 *   llegan, la búsqueda no se registra (ver `isRecordableVehicleSearch`).
 */
const SEARCH_PARAM_KINDS: Record<VehicleSearchQueryKey, SearchParamKind> = {
  query: "text",
  type_slug: "string",
  makes_slugs: "string_array",
  models_slugs: "string_array",
  categories_slugs: "string_array",
  since_price: "number",
  until_price: "number",
  price_offer: "boolean",
  provinces_slugs: "string_array",
  comunities_slugs: "string_array",
  municipalities_slugs: "string_array",
  service_slugs: "string_array",
  lat: "number",
  lng: "number",
  radius: "number",
  publisher_types: "string_array",
  is_seller_featured: "boolean",
  warranty_slugs: "string_array",
  since_year: "number",
  until_year: "number",
  since_mileage: "number",
  until_mileage: "number",
  transmission_types: "string_array",
  fuel_type_slugs: "string_array",
  traction_slugs: "string_array",
  power_since: "number",
  power_until: "number",
  displacement_since: "number",
  displacement_until: "number",
  dgt_label_ids: "string_array",
  autonomy_since: "number",
  battery_capacity_since: "number",
  battery_capacity_until: "number",
  time_to_charge: "number",
  features_slugs: "string_array",
  color_slugs: "string_array",
  cuota_slugs: "string_array",
  condition: "string",
};

export const VEHICLE_SEARCH_QUERY_KEYS = Object.keys(
  SEARCH_PARAM_KINDS,
) as VehicleSearchQueryKey[];

/** Rangos y ubicación por radio cuentan como un único filtro. */
const FILTER_GROUPS: Partial<Record<VehicleSearchQueryKey, string>> = {
  since_price: "price",
  until_price: "price",
  since_year: "year",
  until_year: "year",
  since_mileage: "mileage",
  until_mileage: "mileage",
  power_since: "power",
  power_until: "power",
  displacement_since: "displacement",
  displacement_until: "displacement",
  battery_capacity_since: "battery_capacity",
  battery_capacity_until: "battery_capacity",
  lat: "radius",
  lng: "radius",
  radius: "radius",
};

/** ~110 m: evita una entrada nueva por cada pequeña variación del GPS. */
const COORDINATE_DECIMALS = 3;

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeText = (value: unknown): string | undefined =>
  normalizeString(value)?.replace(/\s+/g, " ").toLowerCase();

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = [
    ...new Set(
      value
        .map((item) => normalizeString(typeof item === "number" ? String(item) : item))
        .filter((item): item is string => item !== undefined),
    ),
  ].sort();
  return items.length > 0 ? items : undefined;
};

const normalizeNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const normalizeBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const roundCoordinate = (value: number): number =>
  Number(value.toFixed(COORDINATE_DECIMALS));

/**
 * Convierte los params validados de GET /v1/vehicles en una búsqueda estable:
 * solo claves de la lista blanca, sin valores vacíos, arrays deduplicados y
 * ordenados, claves en orden alfabético.
 */
export const normalizeVehicleSearchQuery = (
  params: object,
): VehicleSearchQuery => {
  const source = params as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const key of VEHICLE_SEARCH_QUERY_KEYS) {
    const raw = source[key];
    let value: unknown;
    switch (SEARCH_PARAM_KINDS[key]) {
      case "string": {
        value = normalizeString(raw);
        break;
      }
      case "text": {
        value = normalizeText(raw);
        break;
      }
      case "string_array": {
        value = normalizeStringArray(raw);
        break;
      }
      case "number": {
        value = normalizeNumber(raw);
        break;
      }
      case "boolean": {
        value = normalizeBoolean(raw);
        break;
      }
    }
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  // lat/lng solo filtran junto con un radio > 0 (ver filters.applier).
  const radius = normalized.radius as number | undefined;
  const has_geo =
    typeof normalized.lat === "number" &&
    typeof normalized.lng === "number" &&
    typeof radius === "number" &&
    radius > 0;
  if (has_geo) {
    normalized.lat = roundCoordinate(normalized.lat as number);
    normalized.lng = roundCoordinate(normalized.lng as number);
  } else {
    delete normalized.lat;
    delete normalized.lng;
    delete normalized.radius;
  }

  return Object.fromEntries(
    Object.keys(normalized)
      .sort()
      .map((key) => [key, normalized[key]]),
  ) as VehicleSearchQuery;
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
      );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
};

export const hashVehicleSearchQuery = (query: VehicleSearchQuery): string =>
  createHash("sha256").update(stableStringify(query)).digest("hex");

export const countVehicleSearchFilters = (query: VehicleSearchQuery): number => {
  const groups = new Set<string>();
  for (const key of Object.keys(query) as VehicleSearchQueryKey[]) {
    groups.add(FILTER_GROUPS[key] ?? key);
  }
  return groups.size;
};

interface RecordableVehicleSearchInput {
  params: { page?: number; dealership_ids?: string[]; profile_ids?: string[] };
  query: VehicleSearchQuery;
}

/**
 * Solo se registra la primera página, con al menos un filtro real y fuera de
 * los listados de escaparate de un vendedor.
 */
export const isRecordableVehicleSearch = ({
  params,
  query,
}: RecordableVehicleSearchInput): boolean => {
  const page = params.page ?? 1;
  if (page !== 1) {
    return false;
  }
  if ((params.dealership_ids?.length ?? 0) > 0) {
    return false;
  }
  if ((params.profile_ids?.length ?? 0) > 0) {
    return false;
  }
  return Object.keys(query).length > 0;
};

/** Header opt-in que envían web/mobile solo desde la pantalla de búsqueda. */
export const RECORD_SEARCH_HEADER = "x-record-search";

/**
 * `x-record-search: 1` o `true` (sin distinguir mayúsculas). Express ya entrega
 * los nombres de header en minúsculas; si llega repetido basta con uno válido.
 */
export const isSearchRecordingRequested = (
  header_value: string | string[] | undefined,
): boolean => {
  const values = Array.isArray(header_value) ? header_value : [header_value];
  return values.some((value) => {
    const normalized = value?.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  });
};
