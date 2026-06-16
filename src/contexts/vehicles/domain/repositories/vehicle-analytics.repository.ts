export interface VehiclePeriodCounts {
  vehicle_id: string;
  current: number;
  previous: number;
}

export abstract class VehicleAnalyticsRepository {
  abstract countViewsByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]>;

  abstract countSharesByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]>;

  abstract countLeadsByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]>;

  abstract countFavoritesByVehicleIdsInPeriods(
    vehicle_ids: string[],
    current_start: Date,
    previous_start: Date,
    period_end: Date,
  ): Promise<VehiclePeriodCounts[]>;
}
