import { TransmissionType } from "../../domain/entities/vehicle";

export class UpdateVehicleDto {
  id: string;
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: string;
  title: string;
  description?: string;
  transmission_type?: TransmissionType;
  traction_id?: string;
  power?: number;
  displacement?: number;
  autonomy?: number;
  battery_capacity?: number;
  time_to_charge?: number;
  license_plate?: string;
  features_ids?: string[];
  services_ids?: string[];
  vehicle_type_id?: string | null;
  color_id?: string | null;
  dgt_label_id?: string | null;
  warranty_type_id?: string | null;
}
