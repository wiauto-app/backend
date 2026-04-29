
import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "../create-vehicle-use-case/create-vehicle.dto";
import { IsNotEmpty, IsUUID } from "class-validator";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsNotEmpty()
  @IsUUID("4")
  id: string; 
}
