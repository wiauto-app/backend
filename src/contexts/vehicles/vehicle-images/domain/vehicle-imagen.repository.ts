import { VehicleImage } from "./vehicle-image";


export abstract class VehicleImageRepository {
  abstract save(vehicleImage: VehicleImage): Promise<void>;
  abstract saveBulk(vehicleImages: VehicleImage[]): Promise<void>;
  abstract delete(vehicleImage: VehicleImage): Promise<void>;
  /**
   * Elimina los objetos en storage para todas las imágenes del vehículo.
   * Las filas en BD se eliminan al borrar el vehículo (CASCADE) o pueden borrarse antes en el mismo flujo.
   */
  abstract remove_storage_for_vehicle(vehicle_id: string): Promise<void>;
}