import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../entities/vehicle";

export interface AdminVehicleFormImage {
  path: string;
  order: number;
}

/** IDs del catálogo asociados a `version_id` (marca → versión). */
export interface AdminVehicleVersionCatalog {
  make_id: number;
  model_id: number;
  body_type_id: number;
  fuel_type_id: number;
  year_id: number;
}

/** Detalle admin para rellenar el formulario de creación/edición. */
export interface AdminVehicleDetail {
  id: string;
  vin_code?: string | null;
  vehicle_type_id: string | null;
  category_id: string | null;
  title: string;
  description: string;
  price: number;
  mileage: number;
  condition: ConditionVehicle;
  lat: number;
  lng: number;
  version_id: number;
  version_catalog: AdminVehicleVersionCatalog;
  traction_id: string;
  transmission_type: TransmissionType;
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  license_plate: string;
  publisher_type: PublisherType;
  phone_code: string;
  phone: string;
  email: string;
  features_ids: string[];
  services_ids: string[];
  color_id: string | null;
  dgt_label_id: string | null;
  warranty_type_id: string | null;
  cuota_ids: string[];
  images: AdminVehicleFormImage[];
}
