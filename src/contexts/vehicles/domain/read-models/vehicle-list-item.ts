import {
  PublisherType,
  StatusVehicle,
  TransmissionType,
} from "../entities/vehicle";

export interface VehicleListItemCatalogRef {
  id: string;
  name: string;
  slug: string;
}

export interface VehicleListItemImage {
  id: string;
  url: string;
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
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: string;
  title: string;
  created_at: Date;
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
}

/** Proyección admin: listado público + campos de moderación y ficha técnica. */
export interface AdminVehicleListItem extends VehicleListItem {
  status: StatusVehicle;
  publisher_type: PublisherType;
  is_featured: boolean;
  expires_at: Date;
  views: number;
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
  traction: VehicleListItemCatalogRef;
}
