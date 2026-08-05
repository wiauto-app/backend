import type { VehicleListItemPreview } from "../../types/vehicle-list-detail";

export interface DismissedVehicleListItem {
  id: string;
  profile_id: string;
  vehicle_id: string;
  created_at: Date;
  vehicle: VehicleListItemPreview;
}
