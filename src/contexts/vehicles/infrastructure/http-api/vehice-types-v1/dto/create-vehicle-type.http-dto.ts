import { IsNotEmpty, IsString } from "class-validator";


export class CreateVehicleTypeHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}