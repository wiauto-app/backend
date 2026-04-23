import { IsNotEmpty, IsString } from "class-validator";

export class CreateVehicleImageHttpDto {
  // @IsString()
  // @IsNotEmpty()
  // url: string;

  @IsString()
  @IsNotEmpty()
  vehicle_id: string;
}