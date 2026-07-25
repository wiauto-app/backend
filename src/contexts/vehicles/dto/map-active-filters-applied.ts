import { FindActiveFiltersDto } from "./find-active-filters.dto";
import { ActiveFiltersApplied } from "../types/active-filters-response";

const has_non_empty_array = <T>(value: T[] | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

export const mapActiveFiltersApplied = (
  dto: FindActiveFiltersDto,
): ActiveFiltersApplied => {
  const applied: ActiveFiltersApplied = {};

  if (dto.since_price) {
    applied.since_price = dto.since_price;
  }
  if (dto.until_price) {
    applied.until_price = dto.until_price;
  }
  if (dto.price_offer) {
    applied.price_offer = dto.price_offer;
  }
  if (dto.lat != null) {
    applied.lat = dto.lat;
  }
  if (dto.lng != null) {
    applied.lng = dto.lng;
  }
  if (dto.radius != null) {
    applied.radius = dto.radius;
  }
  if (has_non_empty_array(dto.publisher_types)) {
    applied.publisher_types = dto.publisher_types;
  }
  if (dto.is_seller_featured) {
    applied.is_seller_featured = dto.is_seller_featured;
  }
  if (dto.since_year) {
    applied.since_year = dto.since_year;
  }
  if (dto.until_year) {
    applied.until_year = dto.until_year;
  }
  if (dto.since_mileage) {
    applied.since_mileage = dto.since_mileage;
  }
  if (dto.until_mileage) {
    applied.until_mileage = dto.until_mileage;
  }
  if (has_non_empty_array(dto.transmission_types)) {
    applied.transmission_types = dto.transmission_types;
  }
  if (dto.power_since) {
    applied.power_since = dto.power_since;
  }
  if (dto.power_until) {
    applied.power_until = dto.power_until;
  }
  if (dto.displacement_since) {
    applied.displacement_since = dto.displacement_since;
  }
  if (dto.displacement_until) {
    applied.displacement_until = dto.displacement_until;
  }
  if (dto.autonomy_since) {
    applied.autonomy_since = dto.autonomy_since;
  }
  if (dto.battery_capacity_since) {
    applied.battery_capacity_since = dto.battery_capacity_since;
  }
    if (dto.battery_capacity_until) {
    applied.battery_capacity_until = dto.battery_capacity_until;
  }
  if (dto.time_to_charge) {
    applied.time_to_charge = dto.time_to_charge;
  }
  if (dto.condition != null) {
    applied.condition = dto.condition;
  }

  return applied;
};
