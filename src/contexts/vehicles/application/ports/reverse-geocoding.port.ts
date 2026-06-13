import type { VehicleAddressDetails } from "../../domain/value-objects/vehicle-address-details";

export abstract class ReverseGeocodingPort {
  abstract resolve(
    lat: number,
    lng: number,
  ): Promise<VehicleAddressDetails | null>;
}
