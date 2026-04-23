import { Vehicle } from "./vehicle";


export abstract class VehicleRepository {
  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findAll(): Promise<Vehicle[]>;
  abstract findOne(id: string): Promise<Vehicle | null>;
  abstract update(vehicle: Vehicle): Promise<void>;
}