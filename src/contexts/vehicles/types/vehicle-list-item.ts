import { DealershipEntity } from "../../dealership/entities/dealership.entity";
import { VersionEntity } from "../catalog/versions/entities/version.entity";
import {
  PublisherType,
  StatusVehicle,
  TransmissionType,
} from "./vehicle";

export interface VehicleListItemCatalogRef {
  id: string;
  name: string;
  slug: string;
}

export interface VehicleListItemImage {
  id: string;
  url: string;
}

export interface VehicleVersionSummary {
  make_name: string;
  model_name: string;
  version_name: string;
  fuel_name: string;

}

export interface VehicleListItemPublisher {
  id: string;
  name: string;
  avatar_url: string;
}

/**
 * Proyección de listado público: datos necesarios para la API, sin el agregado completo.
 */
export interface VehicleListItem {
  id: string;
  is_featured: boolean;
  ref: string | null;
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: string;
  version_summary: VehicleVersionSummary;
  created_at: Date;
  publisher_type: PublisherType;
  power: number;
  displacement: number;
  transmission_type: TransmissionType;
  images: VehicleListItemImage[];
  features: VehicleListItemCatalogRef[];
  services: VehicleListItemCatalogRef[];
  vehicle_type: VehicleListItemCatalogRef | null;
  category: VehicleListItemCatalogRef | null;
  color: (VehicleListItemCatalogRef & { hex_code: string }) | null;
  dgt_label: (VehicleListItemCatalogRef & { code: string }) | null;
  warranty_type: VehicleListItemCatalogRef | null;
  cuotas: (VehicleListItemCatalogRef & { value: number })[];
  publisher: VehicleListItemPublisher;
  version: VersionEntity;
  show_first_cuota: boolean;
  by_brand_warranty: boolean;
  show_exact_location: boolean;
  show_review_collab: boolean;
  finance_price: number | null;
  dealership: DealershipEntity | null;
}

/** Proyección admin: listado público + campos de moderación y ficha técnica. */
export interface AdminVehicleListItem extends VehicleListItem {
  status: StatusVehicle;
  status_change_message?: string | null;
  publisher_type: PublisherType;
  is_featured: boolean;
  expires_at: Date;
  views: number;
  favorites: number;
  shares: number;
  updated_at: Date;
  transmission_type: TransmissionType;
  power: number;
  displacement: number;
  license_plate: string;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  phone_code: string;
  phone: string;
  email: string;
  version_id: number;
  traction: VehicleListItemCatalogRef | null;
}
