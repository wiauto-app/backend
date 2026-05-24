import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../entities/vehicle";

export interface AdminVehicleFormImage {
  path: string;
  order: number;
}

/** Detalle admin para rellenar el formulario de creación/edición. */
export interface AdminVehicleDetail {
  id: string;
  vin_code?: string | null;
  vehicle_type_id: string | null;
  title: string;
  description: string;
  price: number;
  mileage: number;
  condition: ConditionVehicle;
  lat: number;
  lng: number;
  version_id: number;
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
