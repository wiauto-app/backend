import { StatusVehicle } from "../types/vehicle";

export interface AdminUpdateVehicleStatusDto {
  vehicle_id: string;
  status: StatusVehicle;
  message?: string;
}
