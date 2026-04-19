import { IsNotEmpty, IsUUID } from "class-validator";


export class FindVehicleHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}