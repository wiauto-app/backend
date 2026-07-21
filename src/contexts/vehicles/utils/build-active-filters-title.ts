import { ActiveFilterItem } from "../types/active-filter-item";
import { ActiveFiltersResolved } from "../types/active-filters-response";
import { FindActiveFiltersDto } from "../dto/find-active-filters.dto";
import {
  PUBLISHER_TYPE,
  TRANSMISSION_TYPE,
  PublisherType,
  TransmissionType,
} from "../types/vehicle";

const PUBLISHER_TYPE_MAP: Record<PublisherType, string> = {
  [PUBLISHER_TYPE.PARTICULAR]: "particulares",
  [PUBLISHER_TYPE.PROFESSIONAL]: "profesionales",
};

const TRANSMISSION_TYPE_MAP: Record<TransmissionType, string> = {
  [TRANSMISSION_TYPE.MANUAL]: "manual",
  [TRANSMISSION_TYPE.AUTOMATIC]: "automático",
};

interface PushRangeOptions {
  unit?: string;
}

const capitalize = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const joinNames = (items: ActiveFilterItem[]): string | null => {
  if (items.length === 0) {
    return null;
  }
  const names = items
    .map((item) => item.name.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) {
    return null;
  }
  return capitalize(names.join(", "));
};

const formatRangeValue = (value: number, unit?: string): string => {
  const formatted = Number.isInteger(value)
    ? String(value)
    : String(Math.round(value));
  return unit ? `${formatted} ${unit}` : formatted;
};

const pushRange = (
  parts: string[],
  since: number | null | undefined,
  until: number | null | undefined,
  options: PushRangeOptions = {},
): void => {
  const { unit } = options;
  if (since == null && until == null) {
    return;
  }
  if (since != null && until != null) {
    parts.push(
      `desde ${formatRangeValue(since, unit)} hasta ${formatRangeValue(until, unit)}`,
    );
    return;
  }
  if (since != null) {
    parts.push(`desde ${formatRangeValue(since, unit)}`);
    return;
  }
  parts.push(`hasta ${formatRangeValue(until!, unit)}`);
};

const pushIfPresent = (parts: string[], segment: string | null): void => {
  if (segment) {
    parts.push(segment);
  }
};

export const buildActiveFiltersTitle = (
  resolved: ActiveFiltersResolved,
  dto: FindActiveFiltersDto,
): string => {
  const parts: string[] = [];

  pushIfPresent(parts, joinNames(resolved.makes));
  pushIfPresent(parts, joinNames(resolved.models));
  pushIfPresent(parts, joinNames(resolved.categories));

  if (resolved.vehicle_type?.name) {
    parts.push(`de tipo ${capitalize(resolved.vehicle_type.name.trim())}`);
  }

  pushIfPresent(parts, joinNames(resolved.colors));

  const motorAttrs: string[] = [];
  const fuels = joinNames(resolved.fuels);
  const tractions = joinNames(resolved.tractions);
  if (fuels) {
    motorAttrs.push(fuels);
  }
  if (tractions) {
    motorAttrs.push(tractions);
  }
  if (
    Array.isArray(dto.transmission_types) &&
    dto.transmission_types.length > 0
  ) {
    const transmissionLabels = dto.transmission_types
      .map((type) => TRANSMISSION_TYPE_MAP[type])
      .filter(Boolean);
    if (transmissionLabels.length > 0) {
      motorAttrs.push(capitalize(transmissionLabels.join(", ")));
    }
  }
  if (motorAttrs.length > 0) {
    parts.push(`con ${motorAttrs.join(" ")}`);
  }

  pushRange(parts, dto.since_year, dto.until_year);
  pushRange(parts, dto.since_mileage, dto.until_mileage, { unit: "km" });
  pushRange(parts, dto.since_price, dto.until_price, { unit: "€" });

  parts.push("de segunda mano");

  const locationNames = [
    ...resolved.municipalities,
    ...resolved.provinces,
    ...resolved.communities,
  ];
  const location = joinNames(locationNames);
  if (location) {
    parts.push(`en ${location}`);
  }

  pushIfPresent(parts, joinNames(resolved.services));
  pushIfPresent(parts, joinNames(resolved.warranties));
  pushIfPresent(parts, joinNames(resolved.dgt_labels));
  pushIfPresent(parts, joinNames(resolved.features));
  pushIfPresent(parts, joinNames(resolved.cuotas));

  if (
    Array.isArray(dto.publisher_types) &&
    dto.publisher_types.length > 0
  ) {
    const publisherLabels = dto.publisher_types
      .map((type) => PUBLISHER_TYPE_MAP[type])
      .filter(Boolean);
    if (publisherLabels.length > 0) {
      parts.push(`de ${capitalize(publisherLabels.join(", "))}`);
    }
  }

  return parts.join(" ").trim();
};
