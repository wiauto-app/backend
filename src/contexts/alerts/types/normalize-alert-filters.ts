import type { AlertFilters } from "./alert-filters";

const is_plain_object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalize_value = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return [...value].map((item) => normalize_value(item)).sort();
  }

  if (is_plain_object(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = normalize_value(value[key]);
        return accumulator;
      }, {});
  }

  return value;
};

export const normalizeAlertFilters = (filters: AlertFilters): AlertFilters =>
  normalize_value(filters) as AlertFilters;

export const alertFiltersAreEqual = (
  left: AlertFilters,
  right: AlertFilters,
): boolean =>
  JSON.stringify(normalizeAlertFilters(left)) ===
  JSON.stringify(normalizeAlertFilters(right));
