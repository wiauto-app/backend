import type { StatusVehicle, TransmissionType } from "./vehicle";
import type { OwnerListingHealthSummary } from "./vehicle-insights";

export interface OwnerVehicleStatTrend {
  current: number;
  previous: number;
  change_percent: number | null;
}

export interface OwnerVehicleListItem {
  id: string;
  display_name: string;
  price: number;
  mileage: number;
  status: StatusVehicle;
  expires_at: Date;
  is_expired: boolean;
  days_until_expiry: number;
  can_renew: boolean;
  can_schedule: boolean;
  scheduled_publish_at: Date | null;
  renewed_at: Date | null;
  is_featured: boolean;
  featured_expires_at: Date | null;
  featured_boost_weight: number | null;
  is_featured_active: boolean;
  can_feature: boolean;
  transmission_type: TransmissionType;
  fuel_type: string | null;
  image: { id: string; url: string } | null;
  stats: {
    views: OwnerVehicleStatTrend;
    leads: OwnerVehicleStatTrend;
    favorites: OwnerVehicleStatTrend;
    shares: OwnerVehicleStatTrend;
    phone_clicks: OwnerVehicleStatTrend;
    whatsapp_clicks: OwnerVehicleStatTrend;
  };
  /** Resumen de calidad (precio solo si hay stats de mercado en cache). */
  health?: OwnerListingHealthSummary;
  created_at: Date;
  updated_at: Date;
}
