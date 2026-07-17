import { IsIn } from "class-validator";

import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

export class UpdateOwnerVehicleStatusHttpDto {
  @IsIn([STATUS_VEHICLE.ACTIVE, STATUS_VEHICLE.INACTIVE])
  status: typeof STATUS_VEHICLE.ACTIVE | typeof STATUS_VEHICLE.INACTIVE;
}
