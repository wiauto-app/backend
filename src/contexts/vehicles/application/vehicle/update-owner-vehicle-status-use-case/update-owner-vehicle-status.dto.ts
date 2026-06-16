import type { StatusVehicle } from "../../../domain/entities/vehicle";

export interface UpdateOwnerVehicleStatusDto {
  vehicle_id: string;
  status: Extract<StatusVehicle, "active" | "inactive">;
}
