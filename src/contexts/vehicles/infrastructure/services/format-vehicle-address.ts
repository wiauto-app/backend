import type { VehicleAddressDetails } from "../../domain/value-objects/vehicle-address-details";

export interface GoogleGeocodingComponents {
  route: string | null;
  street_number: string | null;
  neighborhood: string | null;
  google_municipality: string | null;
  google_province: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface PostgisLocationNames {
  municipality: string | null;
  province: string | null;
}

const joinNonEmpty = (parts: (string | null | undefined)[], separator: string): string | null => {
  const filtered = parts.filter((part): part is string => Boolean(part?.trim()));
  return filtered.length > 0 ? filtered.join(separator) : null;
};

const buildFormattedLines = (input: {
  street: string | null;
  postal_code: string | null;
  neighborhood: string | null;
  municipality: string | null;
  province: string | null;
  country: string | null;
}): string[] => {
  const lines: string[] = [];

  if (input.street) {
    lines.push(input.street);
  }

  const postalNeighborhood = joinNonEmpty(
    [input.postal_code, input.neighborhood],
    " ",
  );
  const line2 = postalNeighborhood && input.municipality
    ? `${postalNeighborhood}, ${input.municipality}`
    : postalNeighborhood ?? input.municipality;

  if (line2) {
    lines.push(line2);
  }

  const line3 = joinNonEmpty([input.province, input.country], ", ");
  if (line3) {
    lines.push(line3);
  }

  return lines;
};

export const buildVehicleAddressDetails = (
  google: GoogleGeocodingComponents,
  postgis: PostgisLocationNames,
): VehicleAddressDetails => {
  const route = google.route;
  const street_number = google.street_number;
  const street = route
    ? street_number
      ? `${route}, ${street_number}`
      : route
    : null;

  const municipality = postgis.municipality ?? google.google_municipality;
  const province = postgis.province ?? google.google_province;

  const formatted_lines = buildFormattedLines({
    street,
    postal_code: google.postal_code,
    neighborhood: google.neighborhood,
    municipality,
    province,
    country: google.country,
  });

  return {
    street,
    route,
    street_number,
    neighborhood: google.neighborhood,
    municipality,
    province,
    postal_code: google.postal_code,
    country: google.country,
    formatted_lines,
  };
};

export const formatAddressText = (formatted_lines: string[]): string =>
  formatted_lines.join("\n");
