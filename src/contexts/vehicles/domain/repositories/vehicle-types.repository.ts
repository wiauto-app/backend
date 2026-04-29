import { VehicleType } from "../entities/vehicle-types";


export abstract class VehicleTypesRepository {
  abstract findOne(id: string): Promise<VehicleType | null>;
  abstract findAll(): Promise<VehicleType[]>;
  abstract save(vehicleType: VehicleType): Promise<void>;
  abstract update(id: string, name: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}