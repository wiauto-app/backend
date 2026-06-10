import type {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../../domain/entities/vehicle";

export interface PublishedVehicleSnapshot {
  vehicle_id: string;
  profile_id: string;
  title: string;
  cover_image_url: string | null;
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  publisher_type: PublisherType;
  is_featured: boolean;
  make_slug: string;
  model_slug: string;
  year: number;
  fuel_type_slug: string;
  traction_slug: string;
  type_slug: string | null;
  color_slug: string | null;
  warranty_slug: string | null;
  dgt_label_id: string | null;
  feature_slugs: string[];
  service_slugs: string[];
  cuota_slugs: string[];
  province_slugs: string[];
  municipalities_slugs: string[];
  comunities_slugs: string[];
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
}

export abstract class PublishedVehicleSnapshotPort {
  abstract buildForVehicleId(
    vehicle_id: string,
  ): Promise<PublishedVehicleSnapshot | null>;
}
