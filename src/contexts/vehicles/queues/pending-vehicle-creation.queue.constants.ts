import type { CreateVehicleDto } from "../api/v1/create-vehicle/create-vehicle.http-dto";

export const PENDING_VEHICLE_CREATION_QUEUE = "pending-vehicle-creation";

export const PENDING_VEHICLE_CREATION_JOB_CREATE_DRAFT = "create-draft";

export interface PendingVehicleCreationJobData {
  profile_id: string;
  guest_id: string | null;
  vehicle: CreateVehicleDto;
}
