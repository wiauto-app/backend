import type { VehicleListSummary } from "./list";

export interface VehicleListFavoriteMembership {
  vehicle_id: string;
  list_ids: string[];
}

export interface VehicleListFavoritesSnapshot {
  lists: VehicleListSummary[];
  memberships: VehicleListFavoriteMembership[];
}
