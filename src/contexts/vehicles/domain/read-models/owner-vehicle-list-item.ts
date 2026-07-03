import type { StatusVehicle, TransmissionType } from "../entities/vehicle";

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
  created_at: Date;
  updated_at: Date;
}
