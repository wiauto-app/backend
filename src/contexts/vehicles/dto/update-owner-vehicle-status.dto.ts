import type { StatusVehicle } from "../types/vehicle";

export interface UpdateOwnerVehicleStatusDto {
  vehicle_id: string;
  status:StatusVehicle;
}
