import type { AlertFilters } from "../types/alert-filters";
import type { PublishedVehicleSnapshot } from "@/src/contexts/vehicles/ports/published-vehicle-snapshot.port";

const EARTH_RADIUS_METERS = 6_371_000;

const slug_overlap = (filter_slugs: string[], vehicle_slugs: string[]): boolean =>
  filter_slugs.some((slug) => vehicle_slugs.includes(slug));

const distance_meters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const to_rad = (degrees: number) => (degrees * Math.PI) / 180;
  const d_lat = to_rad(lat2 - lat1);
  const d_lng = to_rad(lng2 - lng1);
  const a =
    Math.sin(d_lat / 2) ** 2 +
    Math.cos(to_rad(lat1)) *
      Math.cos(to_rad(lat2)) *
      Math.sin(d_lng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const is_filter_active = (filters: AlertFilters, key: keyof AlertFilters): boolean => {
  const value = filters[key];
  if (value === undefined || value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "boolean") {
    return true;
  }
  return false;
};

export const vehicle_matches_alert_filters = (
  snapshot: PublishedVehicleSnapshot,
  filters: AlertFilters,
): boolean => {
  if (
    is_filter_active(filters, "type_slug") &&
    snapshot.type_slug !== filters.type_slug
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "makes_slugs") &&
    !slug_overlap(filters.makes_slugs!, [snapshot.make_slug])
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "models_slugs") &&
    !slug_overlap(filters.models_slugs!, [snapshot.model_slug])
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "since_price") &&
    snapshot.price < filters.since_price!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "until_price") &&
    snapshot.price > filters.until_price!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "since_mileage") &&
    snapshot.mileage < filters.since_mileage!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "until_mileage") &&
    snapshot.mileage > filters.until_mileage!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "since_year") &&
    snapshot.year < filters.since_year!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "until_year") &&
    snapshot.year > filters.until_year!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "fuel_type_slugs") &&
    !filters.fuel_type_slugs!.includes(snapshot.fuel_type_slug)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "traction_slugs") &&
    !filters.traction_slugs!.includes(snapshot.traction_slug)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "color_slugs") &&
    (!snapshot.color_slug || !filters.color_slugs!.includes(snapshot.color_slug))
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "warranty_slugs") &&
    (!snapshot.warranty_slug ||
      !filters.warranty_slugs!.includes(snapshot.warranty_slug))
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "service_slugs") &&
    !slug_overlap(filters.service_slugs!, snapshot.service_slugs)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "features_slugs") &&
    !filters.features_slugs!.every((slug) =>
      snapshot.feature_slugs.includes(slug),
    )
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "cuota_slugs") &&
    !slug_overlap(filters.cuota_slugs!, snapshot.cuota_slugs)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "provinces_slugs") &&
    !slug_overlap(filters.provinces_slugs!, snapshot.province_slugs)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "comunities_slugs") &&
    !slug_overlap(filters.comunities_slugs!, snapshot.comunities_slugs)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "municipalities_slugs") &&
    !slug_overlap(filters.municipalities_slugs!, snapshot.municipalities_slugs)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "publisher_types") &&
    !filters.publisher_types!.includes(snapshot.publisher_type)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "is_seller_featured") &&
    snapshot.is_featured !== filters.is_seller_featured
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "transmission_types") &&
    !filters.transmission_types!.includes(snapshot.transmission_type)
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "power_since") &&
    snapshot.power < filters.power_since!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "power_until") &&
    snapshot.power > filters.power_until!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "displacement_since") &&
    snapshot.displacement < filters.displacement_since!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "displacement_until") &&
    snapshot.displacement > filters.displacement_until!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "dgt_label_ids") &&
    (!snapshot.dgt_label_id ||
      !filters.dgt_label_ids!.includes(snapshot.dgt_label_id))
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "autonomy_since") &&
    snapshot.autonomy < filters.autonomy_since!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "battery_capacity_since") &&
    snapshot.battery_capacity < filters.battery_capacity_since!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "battery_capacity_until") &&
    snapshot.battery_capacity > filters.battery_capacity_until!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "time_to_charge") &&
    snapshot.time_to_charge < filters.time_to_charge!
  ) {
    return false;
  }

  if (
    is_filter_active(filters, "lat") &&
    is_filter_active(filters, "lng") &&
    is_filter_active(filters, "radius")
  ) {
    const distance = distance_meters(
      snapshot.lat,
      snapshot.lng,
      filters.lat!,
      filters.lng!,
    );
    if (distance > filters.radius!) {
      return false;
    }
  }

  return true;
};
