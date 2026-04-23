import { v4 as uuidv4 } from "uuid";

export interface PrimitiveVehicle {
  id: string;
  price: number;
  mileage: number;
  lat: number;
  lng: number;
  condition: string;
  title: string;
  description: string;
  version_id: number;
  status?: string;
  is_featured?: boolean;
  expires_at?: Date;
  views?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type VehicleUpdateFields = Pick<
  PrimitiveVehicle,
  "price" | "mileage" | "lat" | "lng" | "condition" | "title"
>;

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
    condition: string;
    title: string;
    description: string;
    version_id: number;
  }): Vehicle {
    return new Vehicle({
      ...createVehicle,
      id: uuidv4(),
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
    };
  }
}
