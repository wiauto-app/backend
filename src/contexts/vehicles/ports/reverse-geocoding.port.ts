import type { VehicleAddressDetails } from "../types/vehicle-address-details";

export abstract class ReverseGeocodingPort {
  abstract resolve(
    lat: number,
    lng: number,
  ): Promise<VehicleAddressDetails | null>;
}
