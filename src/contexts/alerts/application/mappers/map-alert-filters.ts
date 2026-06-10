import type { AlertFilters } from "../../domain/filters/alert-filters";
import type { AlertFiltersDto } from "../alert-filters.dto";

const has_value = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string" && value.trim() === "") {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
};

export const mapToAlertFilters = (source: AlertFiltersDto): AlertFilters => {
  const filters: AlertFilters = {};

  for (const [key, value] of Object.entries(source)) {
    if (has_value(value)) {
      (filters as Record<string, unknown>)[key] = value;
    }
  }

  return filters;
};
