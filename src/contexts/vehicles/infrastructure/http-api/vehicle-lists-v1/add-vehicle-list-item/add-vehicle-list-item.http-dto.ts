import { IsNotEmpty, IsUUID } from "class-validator";

export class AddVehicleListItemHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  vehicle_id: string;
}
