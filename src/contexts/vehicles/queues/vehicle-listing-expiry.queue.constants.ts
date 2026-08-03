export const VEHICLE_LISTING_EXPIRY_QUEUE = "vehicle-listing-expiry";

export const VEHICLE_LISTING_EXPIRY_JOB_WARN = "warn";
export const VEHICLE_LISTING_EXPIRY_JOB_EXPIRE = "expire";

export interface VehicleListingExpiryJobData {
  vehicle_id: string;
}

export const vehicleListingExpiryWarnJobId = (vehicle_id: string): string =>
  `vehicle-listing-expiry-warn-${vehicle_id}`;

export const vehicleListingExpiryExpireJobId = (vehicle_id: string): string =>
  `vehicle-listing-expiry-expire-${vehicle_id}`;
