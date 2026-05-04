import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

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
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: ConditionVehicle;
  title: string;
  description: string;
  publisher_type: PublisherType;
  version_id: number;
  status?: StatusVehicle;
  is_featured?: boolean;
  expires_at?: Date;
  views?: number;
  transmission_type: TransmissionType;
  traction_id: string;
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  license_plate: string;
  phone_code: string;
  phone: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
  features_ids: string[];
  services_ids: string[];
  vehicle_type_id: string | null;
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
    price: number;
    mileage: number;
    lat: number;
    lng: number;
    condition: ConditionVehicle;
    title: string;
    description: string;
    publisher_type: PublisherType;
    version_id: number;
    phone_code: string;
    phone: string;
    email: string;
    features_ids: string[];
    services_ids?: string[];
    vehicle_type_id?: string | null;
    color_id?: string | null;
    dgt_label_id?: string | null;
    warranty_type_id?: string | null;
    cuota_ids?: string[];
    profile_id: string;
    traction_id: string;
    transmission_type: TransmissionType;
    power: number;
    displacement: number;
    autonomy: number;
    battery_capacity: number;
    time_to_charge: number;
    license_plate: string;
    suggestions: string[];
  }): Vehicle {
    return new Vehicle({
      ...createVehicle,
      id: uuidv4(),
      services_ids: createVehicle.services_ids ?? [],
      vehicle_type_id: createVehicle.vehicle_type_id ?? null,
      color_id: createVehicle.color_id ?? null,
      dgt_label_id: createVehicle.dgt_label_id ?? null,
      warranty_type_id: createVehicle.warranty_type_id ?? null,
      cuota_ids: createVehicle.cuota_ids ?? [],
      profile_id: createVehicle.profile_id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
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
      price: this.primitiveVehicle.price,
      mileage: this.primitiveVehicle.mileage,
      lat: this.primitiveVehicle.lat,
      lng: this.primitiveVehicle.lng,
      condition: this.primitiveVehicle.condition,
      title: this.primitiveVehicle.title,
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
      phone_code: this.primitiveVehicle.phone_code,
      phone: this.primitiveVehicle.phone,
      email: this.primitiveVehicle.email,
      features_ids: this.primitiveVehicle.features_ids,
      services_ids: this.primitiveVehicle.services_ids,
      vehicle_type_id: this.primitiveVehicle.vehicle_type_id,
      color_id: this.primitiveVehicle.color_id,
      dgt_label_id: this.primitiveVehicle.dgt_label_id,
      warranty_type_id: this.primitiveVehicle.warranty_type_id,
      cuota_ids: this.primitiveVehicle.cuota_ids,
      suggestions: this.primitiveVehicle.suggestions,
      profile_id: this.primitiveVehicle.profile_id,
    };
  }
}
