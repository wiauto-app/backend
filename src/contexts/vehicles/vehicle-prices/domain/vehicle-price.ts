import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export const VEHICLE_PRICE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type VehiclePriceStatus =
  (typeof VEHICLE_PRICE_STATUS)[keyof typeof VEHICLE_PRICE_STATUS];

export interface PrimitiveVehiclePrice {
  id: string;
  price: number;
  status: VehiclePriceStatus;
  vehicle_id: string;
  created_at: Date;
}

export class VehiclePrice {
  constructor(private readonly primitive_vehicle_price: PrimitiveVehiclePrice) {}

  static create(create_vehicle_price: {
    price: number;
    vehicle_id: string;
    status?: VehiclePriceStatus;
  }): VehiclePrice {
    return new VehiclePrice({
      id: uuidv4(),
      price: create_vehicle_price.price,
      status: create_vehicle_price.status ?? VEHICLE_PRICE_STATUS.ACTIVE,
      vehicle_id: create_vehicle_price.vehicle_id,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveVehiclePrice): VehiclePrice {
    return new VehiclePrice(primitive);
  }

  toPrimitives(): PrimitiveVehiclePrice {
    return {
      id: this.primitive_vehicle_price.id,
      price: this.primitive_vehicle_price.price,
      status: this.primitive_vehicle_price.status,
      vehicle_id: this.primitive_vehicle_price.vehicle_id,
      created_at: this.primitive_vehicle_price.created_at,
    };
  }
}
