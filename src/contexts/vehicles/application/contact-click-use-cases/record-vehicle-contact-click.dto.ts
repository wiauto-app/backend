import type { ContactClickType } from "../../domain/entities/contact-click";

export interface RecordVehicleContactClickDto {
  vehicle_id: string;
  type: ContactClickType;
  profile_id?: string;
}
