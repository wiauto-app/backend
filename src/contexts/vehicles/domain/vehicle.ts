import { v4 as uuidv4 } from 'uuid';

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

export class Vehicle {

  constructor(private readonly primitiveVehicle: PrimitiveVehicle) { }

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
    return new Vehicle(
      {
        ...createVehicle,
        id: uuidv4(),
        //90 days
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90)
      }
    );
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
      version_id: this.primitiveVehicle.version_id,
    };
  }
}