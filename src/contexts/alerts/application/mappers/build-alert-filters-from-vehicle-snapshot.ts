import type { PublishedVehicleSnapshot } from "@/src/contexts/vehicles/application/ports/published-vehicle-snapshot.port";

import type { AlertFilters } from "../../domain/filters/alert-filters";

const SIMILAR_RADIUS_METERS = 100_000;
const TIER1_YEAR_DELTA = 1;
const MILEAGE_TOLERANCE_RATIO = 0.3;

export const buildAlertFiltersFromVehicleSnapshot = (
  snapshot: PublishedVehicleSnapshot,
): AlertFilters => {
  const mileage_delta = Math.round(snapshot.mileage * MILEAGE_TOLERANCE_RATIO);

  return {
    condition: snapshot.condition,
    makes_slugs: [snapshot.make_slug],
    models_slugs: [snapshot.model_slug],
    since_year: snapshot.year - TIER1_YEAR_DELTA,
    until_year: snapshot.year + TIER1_YEAR_DELTA,
    since_mileage: Math.max(0, snapshot.mileage - mileage_delta),
    until_mileage: snapshot.mileage + mileage_delta,
    transmission_types: [snapshot.transmission_type],
    fuel_type_slugs: [snapshot.fuel_type_slug],
    lat: snapshot.lat,
    lng: snapshot.lng,
    radius: SIMILAR_RADIUS_METERS,
    source_vehicle_id: snapshot.vehicle_id,
  };
};

const humanize_slug = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildDefaultAlertNameFromVehicleSnapshot = (
  snapshot: PublishedVehicleSnapshot,
): string => {
  const make_label = humanize_slug(snapshot.make_slug);
  const model_label = humanize_slug(snapshot.model_slug);
  const catalog_label = `Alerta: ${make_label} ${model_label}`.trim();

  if (catalog_label !== "Alerta:") {
    return catalog_label;
  }

  return snapshot.vehicle_label.trim() || catalog_label;
};
