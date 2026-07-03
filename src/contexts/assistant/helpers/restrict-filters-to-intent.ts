import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AssistantIntent } from "../types/assistant-intent";
import type { AssistantResolvedEntities } from "../types/assistant-resolved-entities";

const DEFAULT_RADIUS_METERS = 25_000;

const CATALOG_FILTER_KEYS = [
  "since_price",
  "until_price",
  "price_offer",
  "service_slugs",
  "provinces_slugs",
  "comunities_slugs",
  "municipalities_slugs",
  "publisher_types",
  "is_seller_featured",
  "warranty_slugs",
  "since_year",
  "until_year",
  "since_mileage",
  "until_mileage",
  "transmission_types",
  "fuel_type_slugs",
  "traction_slugs",
  "power_since",
  "power_until",
  "displacement_since",
  "displacement_until",
  "dgt_label_ids",
  "autonomy_since",
  "battery_capacity_since",
  "battery_capacity_until",
  "time_to_charge",
  "features_slugs",
  "color_slugs",
  "cuota_slugs",
  "exclude_vehicle_ids",
  "dealership_ids",
] as const satisfies ReadonlyArray<keyof SearchVehiclesInput>;

export const restrictFiltersToExplicitIntent = (
  filters: SearchVehiclesInput,
  intent: AssistantIntent,
  resolved: AssistantResolvedEntities,
): SearchVehiclesInput => {
  const next: SearchVehiclesInput = {};

  for (const key of CATALOG_FILTER_KEYS) {
    const value = filters[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }

  if (intent.make && resolved.make_slug) {
    next.makes_slugs = [resolved.make_slug];
  }

  if (intent.model && resolved.model_slug) {
    next.models_slugs = [resolved.model_slug];
  }

  if (intent.vehicle_type && filters.type_slug) {
    next.type_slug = filters.type_slug;
  }

  if (intent.lat !== undefined && intent.lng !== undefined) {
    next.lat = resolved.lat ?? intent.lat;
    next.lng = resolved.lng ?? intent.lng;
    next.radius = filters.radius ?? DEFAULT_RADIUS_METERS;
  }

  return next;
};
