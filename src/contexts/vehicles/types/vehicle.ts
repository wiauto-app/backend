import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import type { VehicleAddressDetails } from "./vehicle-address-details";

export const PUBLISHER_TYPE = {
  PROFESSIONAL: "professional",
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
  phone_code: string;
  phone: string;
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
}

export type VehicleUpdateFields = Partial<PrimitiveVehicle>;

export class Vehicle {
  constructor(private readonly primitiveVehicle: PrimitiveVehicle) {}

  static fromPrimitives(primitive: PrimitiveVehicle): Vehicle {
    return new Vehicle(primitive);
  }

  static create(createVehicle: {
    mileage: number;
    lat: number;
    lng: number;
    condition: ConditionVehicle;
    description: string;
    publisher_type: PublisherType;
    version_id: number;
    phone_code: string;
    phone: string;
    has_whatsapp?: boolean;
    show_phone?: boolean;
    email: string;
    features_ids: string[];
    services_ids?: string[];
    vehicle_type_id?: string | null;
    category_id?: string | null;
    color_id?: string | null;
    dgt_label_id?: string | null;
    warranty_type_id?: string | null;
    cuota_ids?: string[];
    profile_id: string;
    traction_id?: string | null;
    transmission_type: TransmissionType;
    power: number;
    displacement: number;
    autonomy: number;
    battery_capacity: number;
    time_to_charge: number;
    license_plate: string;
    vin_code: string;
    suggestions: string[];
    address?: string | null;
    address_details?: VehicleAddressDetails | null;
  }): Vehicle {
    return new Vehicle({
      ...createVehicle,
      has_whatsapp: createVehicle.has_whatsapp ?? false,
      show_phone: createVehicle.show_phone ?? true,
      traction_id: createVehicle.traction_id ?? null,
      address: createVehicle.address ?? null,
      address_details: createVehicle.address_details ?? null,
      id: uuidv4(),
      services_ids: createVehicle.services_ids ?? [],
      vehicle_type_id: createVehicle.vehicle_type_id ?? null,
      category_id: createVehicle.category_id ?? null,
      color_id: createVehicle.color_id ?? null,
      dgt_label_id: createVehicle.dgt_label_id ?? null,
      warranty_type_id: createVehicle.warranty_type_id ?? null,
      cuota_ids: createVehicle.cuota_ids ?? [],
      profile_id: createVehicle.profile_id,
      status: STATUS_VEHICLE.PENDING,
      status_change_message: null,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      scheduled_publish_at: null,
      renewed_at: null,
      featured_expires_at: null,
    });
  }

  applyUpdates(fields: VehicleUpdateFields): Vehicle {
    return new Vehicle({
      ...this.primitiveVehicle,
      ...fields,
      updated_at: new Date(),
    });
  }

  toPrimitives(): PrimitiveVehicle {
    return {
      ...this.primitiveVehicle,
      id: this.primitiveVehicle.id,
      mileage: this.primitiveVehicle.mileage,
      lat: this.primitiveVehicle.lat,
      lng: this.primitiveVehicle.lng,
      condition: this.primitiveVehicle.condition,
      description: this.primitiveVehicle.description,
      version_id: this.primitiveVehicle.version_id,
      publisher_type: this.primitiveVehicle.publisher_type,
      transmission_type: this.primitiveVehicle.transmission_type,
      traction_id: this.primitiveVehicle.traction_id,
      power: this.primitiveVehicle.power,
      displacement: this.primitiveVehicle.displacement,
      autonomy: this.primitiveVehicle.autonomy,
      battery_capacity: this.primitiveVehicle.battery_capacity,
      time_to_charge: this.primitiveVehicle.time_to_charge,
      license_plate: this.primitiveVehicle.license_plate,
      vin_code: this.primitiveVehicle.vin_code,
      phone_code: this.primitiveVehicle.phone_code,
      phone: this.primitiveVehicle.phone,
      has_whatsapp: this.primitiveVehicle.has_whatsapp ?? false,
      show_phone: this.primitiveVehicle.show_phone ?? true,
      email: this.primitiveVehicle.email,
      features_ids: this.primitiveVehicle.features_ids,
      services_ids: this.primitiveVehicle.services_ids,
      vehicle_type_id: this.primitiveVehicle.vehicle_type_id,
      category_id: this.primitiveVehicle.category_id,
      color_id: this.primitiveVehicle.color_id,
      dgt_label_id: this.primitiveVehicle.dgt_label_id,
      warranty_type_id: this.primitiveVehicle.warranty_type_id,
      cuota_ids: this.primitiveVehicle.cuota_ids,
      suggestions: this.primitiveVehicle.suggestions,
      profile_id: this.primitiveVehicle.profile_id,
      views: this.primitiveVehicle.views,
      favorites: this.primitiveVehicle.favorites,
      shares: this.primitiveVehicle.shares,
      scheduled_publish_at: this.primitiveVehicle.scheduled_publish_at ?? null,
      renewed_at: this.primitiveVehicle.renewed_at ?? null,
      address: this.primitiveVehicle.address ?? null,
      address_details: this.primitiveVehicle.address_details ?? null,
    };
  }
}
