import { Injectable, Logger } from "@nestjs/common";

import { ReverseGeocodingPort } from "../ports/reverse-geocoding.port";
import type { VehicleAddressDetails } from "../types/vehicle-address-details";
import { buildVehicleAddressDetails } from "./format-vehicle-address";
import { GoogleReverseGeocodingService } from "./google-reverse-geocoding.service";
import { PostgisLocationResolver } from "./postgis-location.resolver";

@Injectable()
export class ReverseGeocodingService extends ReverseGeocodingPort {
  private readonly logger = new Logger(ReverseGeocodingService.name);

  constructor(
    private readonly google_reverse_geocoding_service: GoogleReverseGeocodingService,
    private readonly postgis_location_resolver: PostgisLocationResolver,
  ) {
    super();
  }

  async resolve(lat: number, lng: number): Promise<VehicleAddressDetails | null> {
    try {
      const google_components = await this.google_reverse_geocoding_service.geocode(
        lat,
        lng,
      );
      if (!google_components) {
        return null;
      }

      const postgis_names = await Promise.race([
        this.postgis_location_resolver.resolve(lng, lat),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 8_000);
        }),
      ]);
      return buildVehicleAddressDetails(
        google_components,
        postgis_names ?? { municipality: null, province: null },
      );
    } catch (error) {
      this.logger.warn(
        `Reverse geocoding failed for lat=${lat}, lng=${lng}: ${String(error)}`,
      );
      return null;
    }
  }
}
