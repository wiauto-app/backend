import {
  ConditionVehicle,
  PrimitiveVehicle,
  PublisherType,
  StatusVehicle,
  TransmissionType,
} from "./vehicle";
import type { VehicleAddressDetails } from "./vehicle-address-details";
import { VehiclePriceStatus } from "../vehicle-prices/types/vehicle-price";
import {
  VehicleListItem,
  VehicleListItemCatalogRef,
} from "./vehicle-list-item";

export interface VehicleDetailPrice {
  id: string;
  price: number;
  status: VehiclePriceStatus;
  created_at: Date;
}

/** Detalle público de un anuncio con relaciones cargadas. */
export interface VehicleDetail extends VehicleListItem {
  description: string;
  publisher_type: PublisherType;
  status: StatusVehicle;
  status_change_message?: string | null;
  is_featured: boolean;
  expires_at: Date;
  views: number;
  favorites: number;
  shares: number;
  updated_at: Date;
  transmission_type: TransmissionType;
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  license_plate: string;
  vin_code?: string;
  version_id: number;
  traction: VehicleListItemCatalogRef | null;
  phone_code: string;
  phone: string;
  has_whatsapp: boolean;
  show_phone: boolean;
  email: string;
  profile_id: string;
  suggestions: string[];
  prices: VehicleDetailPrice[];
  version: Version;
  address?: string | null;
  address_details?: VehicleAddressDetails | null;
  dealership?: VehicleDetailDealership;
}

export interface Version {
  id: number;
  make_id: number;
  model_id: number;
  body_type_id: number;
  fuel_type_id: number;
  year_id: number;
  name: string;
  slug: string;
  created_at: Date;
  make: Make;
  model: Model;
  body_type: BodyType;
  fuel_type: FuelType;
  year: Year;
}

export interface Year {
  id: number;
  year: number;
  slug: string;
  created_at: Date;
}

export interface Make {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
}

export interface Model {
  id: number;
  make_id: number;
  model_id: number;
  name: string;
  slug: string;
  created_at: Date;
}

export interface BodyType {
  id: number;
  name: string;
  slug: string;
  doors: number;
  created_at: Date;
}

export interface FuelType {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
}

export interface VehicleDetailDealership {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  description: string;
  website_url?: string;
  email: string;
  phone_code: string;
}

export const vehicleDetailToPrimitives = (
  detail: VehicleDetail,
): PrimitiveVehicle => ({
  id: detail.id,
  mileage: detail.mileage,
  lat: detail.lat,
  lng: detail.lng,
  condition: detail.condition as ConditionVehicle,
  description: detail.description,
  version_id: detail.version_id,
  publisher_type: detail.publisher_type,
  transmission_type: detail.transmission_type,
  traction_id: detail.traction?.id ?? null,
  power: detail.power,
  displacement: detail.displacement,
  autonomy: detail.autonomy,
  battery_capacity: detail.battery_capacity,
  time_to_charge: detail.time_to_charge,
  license_plate: detail.license_plate,
  vin_code: detail.vin_code,
  phone_code: detail.phone_code,
  phone: detail.phone,
  has_whatsapp: detail.has_whatsapp,
  show_phone: detail.show_phone,
  email: detail.email,
  features_ids: detail.features.map((feature) => feature.id),
  services_ids: detail.services.map((service) => service.id),
  vehicle_type_id: detail.vehicle_type?.id ?? null,
  category_id: detail.category?.id ?? null,
  color_id: detail.color?.id ?? null,
  dgt_label_id: detail.dgt_label?.id ?? null,
  warranty_type_id: detail.warranty_type?.id ?? null,
  cuota_ids: detail.cuotas.map((cuota) => cuota.id),
  suggestions: detail.suggestions,
  profile_id: detail.profile_id,
  status: detail.status,
  status_change_message: detail.status_change_message ?? null,
  is_featured: detail.is_featured,
  expires_at: detail.expires_at,
  views: detail.views,
  favorites: detail.favorites,
  shares: detail.shares,
  created_at: detail.created_at,
  updated_at: detail.updated_at,
  address: detail.address ?? null,
  address_details: detail.address_details ?? null,
});
