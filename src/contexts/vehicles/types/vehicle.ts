import type { VehicleAddressDetails } from "./vehicle-address-details";

export const PUBLISHER_TYPE = {
  DEALERSHIP: "dealership",
  PARTICULAR: "particular",
} as const;
export type PublisherType = (typeof PUBLISHER_TYPE)[keyof typeof PUBLISHER_TYPE];

export const TRANSMISSION_TYPE = {
  MANUAL: "manual",
  AUTOMATIC: "automatic",
} as const;

export const STATUS_VEHICLE = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
  SOLD: "sold",
  ARCHIVED: "archived",
} as const;

export const CONDITION_VEHICLE = {
  NEW: "new",
  USED: "used",
} as const;

export type ConditionVehicle = (typeof CONDITION_VEHICLE)[keyof typeof CONDITION_VEHICLE];
export type StatusVehicle = (typeof STATUS_VEHICLE)[keyof typeof STATUS_VEHICLE];
export type TransmissionType =
  (typeof TRANSMISSION_TYPE)[keyof typeof TRANSMISSION_TYPE];

export interface PrimitiveVehicle {
  id: string;
  /** Referencia pública autoincremental (generada por BD). */
  ref?: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: ConditionVehicle;
  description: string;
  publisher_type: PublisherType;
  version_id: number;
  status?: StatusVehicle;
  status_change_message?: string | null;
  is_featured?: boolean;
  featured_expires_at?: Date | null;
  featured_boost_weight?: number | null;
  expires_at?: Date;
  scheduled_publish_at?: Date | null;
  renewed_at?: Date | null;
  views?: number;
  favorites?: number;
  shares?: number;
  address?: string | null;
  address_details?: VehicleAddressDetails | null;
  transmission_type: TransmissionType;
  traction_id: string | null;
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  license_plate: string;
  vin_code?: string;
  phone_code?: string | null;
  phone?: string | null;
  has_whatsapp?: boolean;
  show_phone?: boolean;
  email: string;
  created_at?: Date;
  updated_at?: Date;
  features_ids: string[];
  services_ids: string[];
  vehicle_type_id: string | null;
  category_id: string | null;
  color_id: string | null;
  dgt_label_id: string | null;
  warranty_type_id: string | null;
  cuota_ids: string[];
  suggestions: string[];
  /** Dueño del anuncio (mismo UUID que `users.id` / `profiles.id`). */
  profile_id?: string;
  dealership_id?: string | null;
  finance_price?: number | null;
  show_exact_location?: boolean;
  first_cuota?: number | null;
  by_brand_warranty?: boolean;
  show_first_cuota?: boolean;
}

export type VehicleUpdateFields = Partial<PrimitiveVehicle>;

export const normalizeNullableUuid = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized;
};

export const applyVehicleUpdates = (
  vehicle: PrimitiveVehicle,
  fields: VehicleUpdateFields,
): PrimitiveVehicle => ({
  ...vehicle,
  ...fields,
  updated_at: new Date(),
});
