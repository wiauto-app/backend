import { CONTACT_CLICK_TYPE } from "@/src/contexts/vehicles/types/contact-click";
import { IsEnum, IsUUID } from "class-validator";

export class RecordVehicleContactClickParamsHttpDto {
  @IsUUID("4")
  vehicle_id: string;
}

export class RecordVehicleContactClickBodyHttpDto {
  @IsEnum(CONTACT_CLICK_TYPE)
  type: (typeof CONTACT_CLICK_TYPE)[keyof typeof CONTACT_CLICK_TYPE];
}
