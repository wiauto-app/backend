import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import {
  STATUS_VEHICLE,
  StatusVehicle,
} from "@/src/contexts/vehicles/types/vehicle";

export class AdminUpdateVehicleStatusHttpDto {
  @IsEnum(STATUS_VEHICLE)
  status: StatusVehicle;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
