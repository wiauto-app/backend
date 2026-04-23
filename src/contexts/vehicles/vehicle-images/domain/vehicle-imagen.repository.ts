import { VehicleImage } from "./vehicle-image";


export abstract class VehicleImageRepository {
  abstract save(vehicleImage: VehicleImage): Promise<void>;
  abstract saveBulk(vehicleImages: VehicleImage[]): Promise<void>;
  abstract delete(vehicleImage: VehicleImage): Promise<void>;
}