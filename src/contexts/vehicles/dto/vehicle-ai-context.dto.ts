import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "@/src/contexts/vehicles/types/vehicle";

export interface GenerationSettingsDto {
  objective?: string | null;
  persuasion?: string | null;
  extension?: string | null;
  tone?: string | null;
}

export interface VehicleAiContextDto {
  version_id: number;
  condition: ConditionVehicle;
  mileage: number;
  transmission_type: TransmissionType;
  power: number;
  displacement?: number;
  lat: number;
  lng: number;
  vehicle_type_id?: string | null;
  publisher_type?: PublisherType;
  color_id?: string | null;
  category_id?: string | null;
  dgt_label_id?: string | null;
  traction_id?: string | null;
  autonomy?: number;
  battery_capacity?: number;
  time_to_charge?: number;
  settings?: GenerationSettingsDto;
}
