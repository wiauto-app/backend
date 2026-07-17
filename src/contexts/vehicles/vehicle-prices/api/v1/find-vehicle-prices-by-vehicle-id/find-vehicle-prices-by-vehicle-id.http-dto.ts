import { IsUUID } from "class-validator";

export class FindVehiclePricesByVehicleIdParamsHttpDto {
  @IsUUID("4")
  vehicle_id: string;
}
