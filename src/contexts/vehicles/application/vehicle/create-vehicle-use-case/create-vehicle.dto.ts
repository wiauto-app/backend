import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../../../domain/entities/vehicle";

export class CreateVehicleDto {
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: ConditionVehicle;
  title: string;
  description: string;
  version_id: number;
  publisher_type: PublisherType;
  transmission_type?: TransmissionType;
  traction_id: string;
  power: number;
  displacement?: number;
  autonomy?: number;
  battery_capacity?: number;
  time_to_charge?: number;
  license_plate?: string;
  phone_code: string;
  phone: string;
  email: string;
  vehicle_type_id: string;
  features_ids?: string[];
  services_ids?: string[];
  color_id?: string | null;
  dgt_label_id?: string | null;
  warranty_type_id?: string | null;
}
