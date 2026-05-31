import { VehiclePrice } from "./vehicle-price";

export abstract class VehiclePriceRepository {
  abstract create(vehicle_price: VehiclePrice): Promise<void>;
  abstract findByVehicleId(vehicle_id: string): Promise<VehiclePrice[]>;
  abstract findActiveByVehicleId(vehicle_id: string): Promise<VehiclePrice | null>;
  abstract findOneByIdAndVehicleId(
    vehicle_price_id: string,
    vehicle_id: string,
  ): Promise<VehiclePrice | null>;
  abstract activatePrice(vehicle_id: string, vehicle_price_id: string): Promise<void>;
  abstract deactivateAllByVehicleId(vehicle_id: string): Promise<void>;
}
