import { StatusVehicle } from "../../../domain/entities/vehicle";

export interface AdminUpdateVehicleStatusDto {
  vehicle_id: string;
  status: StatusVehicle;
  message?: string;
}
