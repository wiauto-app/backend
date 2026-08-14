import { IsEnum } from "class-validator";

import { STATUS_VEHICLE, StatusVehicle } from "@/src/contexts/vehicles/types/vehicle";

export class UpdateOwnerVehicleStatusHttpDto {
  @IsEnum(STATUS_VEHICLE)
  status: StatusVehicle;
}
