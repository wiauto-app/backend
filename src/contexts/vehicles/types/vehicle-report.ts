import type { VehiclePriceStatus } from "../vehicle-prices/types/vehicle-price";
import type { ConditionVehicle, StatusVehicle } from "./vehicle";
import type { VehicleListItemImage, VehicleVersionSummary } from "./vehicle-list-item";

export interface VehicleReportPriceHistoryItem {
  id: string;
  price: number;
  status: VehiclePriceStatus;
  created_at: Date;
}

export interface VehicleReportStats {
  views: number;
  favorites: number;
  shares: number;
  leads: number;
  phone_clicks: number;
  whatsapp_clicks: number;
}

export interface VehicleReport {
  id: string;
  display_name: string;
  status: StatusVehicle;
  condition: ConditionVehicle;
  price: number;
  mileage: number;
  created_at: Date;
  renewed_at: Date | null;
  expires_at: Date;
  images: VehicleListItemImage[];
  version_summary: VehicleVersionSummary;
  price_history: VehicleReportPriceHistoryItem[];
  stats: VehicleReportStats;
}
