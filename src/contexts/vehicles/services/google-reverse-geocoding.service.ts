import { Injectable, Logger } from "@nestjs/common";

import { envs } from "@/src/common/envs";

import type { GoogleGeocodingComponents } from "./format-vehicle-address";

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    address_components: GoogleAddressComponent[];
  }>;
}

const findComponent = (
  components: GoogleAddressComponent[],
  type: string,
): string | null => {
  const component = components.find((item) => item.types.includes(type));
  return component?.long_name ?? null;
};

const findNeighborhood = (
  components: GoogleAddressComponent[],
): string | null => {
  for (const type of ["sublocality_level_1", "sublocality", "neighborhood"]) {
    const value = findComponent(components, type);
    if (value) {
      return value;
    }
  }
  return null;
};

const parseAddressComponents = (
  components: GoogleAddressComponent[],
): GoogleGeocodingComponents => ({
  route: findComponent(components, "route"),
  street_number: findComponent(components, "street_number"),
  neighborhood: findNeighborhood(components),
  google_municipality: findComponent(components, "locality"),
  google_province: findComponent(components, "administrative_area_level_2"),
  postal_code: findComponent(components, "postal_code"),
  country: findComponent(components, "country"),
});

@Injectable()
export class GoogleReverseGeocodingService {
  private readonly logger = new Logger(GoogleReverseGeocodingService.name);

  async geocode(lat: number, lng: number): Promise<GoogleGeocodingComponents | null> {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("language", "es");
    url.searchParams.set("key", envs.GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      this.logger.warn(
        `Google Geocoding HTTP error ${response.status} for lat=${lat}, lng=${lng}`,
      );
      return null;
    }

    const payload = (await response.json()) as GoogleGeocodeResponse;
    if (payload.status !== "OK" || payload.results.length === 0) {
      this.logger.warn(
        `Google Geocoding status=${payload.status} for lat=${lat}, lng=${lng}`,
      );
      return null;
    }

    return parseAddressComponents(payload.results[0].address_components);
  }
}
