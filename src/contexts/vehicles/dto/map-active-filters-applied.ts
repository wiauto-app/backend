import { FindActiveFiltersDto } from "./find-active-filters.dto";
import { ActiveFiltersApplied } from "../types/active-filters-response";

const has_non_empty_array = <T>(value: T[] | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

export const mapActiveFiltersApplied = (
  dto: FindActiveFiltersDto,
): ActiveFiltersApplied => {
  const applied: ActiveFiltersApplied = {};

  if (dto.since_price != null) {
    applied.since_price = dto.since_price;
  }
  if (dto.until_price != null) {
    applied.until_price = dto.until_price;
  }
  if (dto.price_offer != null) {
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
  if (dto.is_seller_featured != null) {
    applied.is_seller_featured = dto.is_seller_featured;
  }
  if (dto.since_year != null) {
    applied.since_year = dto.since_year;
  }
  if (dto.until_year != null) {
    applied.until_year = dto.until_year;
  }
  if (dto.since_mileage != null) {
    applied.since_mileage = dto.since_mileage;
  }
  if (dto.until_mileage != null) {
    applied.until_mileage = dto.until_mileage;
  }
  if (has_non_empty_array(dto.transmission_types)) {
    applied.transmission_types = dto.transmission_types;
  }
  if (dto.power_since != null) {
    applied.power_since = dto.power_since;
  }
  if (dto.power_until != null) {
    applied.power_until = dto.power_until;
  }
  if (dto.displacement_since != null) {
    applied.displacement_since = dto.displacement_since;
  }
  if (dto.displacement_until != null) {
    applied.displacement_until = dto.displacement_until;
  }
  if (dto.autonomy_since != null) {
    applied.autonomy_since = dto.autonomy_since;
  }
  if (dto.battery_capacity_since != null) {
    applied.battery_capacity_since = dto.battery_capacity_since;
  }
  if (dto.battery_capacity_until != null) {
    applied.battery_capacity_until = dto.battery_capacity_until;
  }
  if (dto.time_to_charge != null) {
    applied.time_to_charge = dto.time_to_charge;
  }
  if (dto.condition != null) {
    applied.condition = dto.condition;
  }

  return applied;
};
