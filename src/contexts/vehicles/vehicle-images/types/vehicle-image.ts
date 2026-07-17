import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveVehicleImage {
  id: string;
  url: string;
  vehicle_id: string;
  created_at: Date;
  updated_at: Date;
}

export class VehicleImage {
  constructor(private readonly primitiveImage: PrimitiveVehicleImage) {}

  static create(createImage: {
    url: string;
    vehicle_id: string;
  }): VehicleImage {
    return new VehicleImage({
      ...createImage,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  static fromPrimitives(p: PrimitiveVehicleImage): VehicleImage {
    return new VehicleImage(p);
  }

  toPrimitives(): PrimitiveVehicleImage {
    return {
      ...this.primitiveImage,
      id: this.primitiveImage.id,
      url: this.primitiveImage.url,
      vehicle_id: this.primitiveImage.vehicle_id,
      created_at: this.primitiveImage.created_at,
      updated_at: this.primitiveImage.updated_at,
    };
  }
}