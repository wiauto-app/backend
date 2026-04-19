import { Vehicle } from "./vehicle";


export abstract class VehicleRepository {
  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findOne(id: string): Promise<Vehicle | null>;
}