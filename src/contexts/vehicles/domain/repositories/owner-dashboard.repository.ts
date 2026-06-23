import type {
  OwnerDashboardInventoryVehicleRow,
  OwnerDashboardPriceDeviationRow,
  OwnerDashboardSummaryRaw,
  OwnerDashboardViewsBucket,
} from "../read-models/owner-dashboard";

export abstract class OwnerDashboardRepository {
  abstract getSummary(params: {
    profile_id: string;
    current_start: Date;
    previous_start: Date;
    period_end: Date;
  }): Promise<OwnerDashboardSummaryRaw>;

  abstract getViewsTimeSeries(params: {
    profile_id: string;
    period_start: Date;
    period_end: Date;
  }): Promise<OwnerDashboardViewsBucket[]>;

  abstract countWeeklyVisits(params: {
    profile_id: string;
    week_start: Date;
    week_end: Date;
  }): Promise<number>;

  abstract countWeeklyMessagesReceived(params: {
    profile_id: string;
    week_start: Date;
    week_end: Date;
  }): Promise<number>;

  abstract getActiveInventoryRows(
    profile_id: string,
    now: Date,
  ): Promise<OwnerDashboardInventoryVehicleRow[]>;

  abstract getPriceDeviationRows(
    profile_id: string,
  ): Promise<OwnerDashboardPriceDeviationRow[]>;

  abstract countDealershipReviews(dealership_id: string): Promise<number>;
}
