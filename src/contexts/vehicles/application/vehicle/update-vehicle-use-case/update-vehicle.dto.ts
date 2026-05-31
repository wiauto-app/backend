import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "../../vehicle/create-vehicle-use-case/create-vehicle.dto";
import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsUUID("4")
  vehicle_price_id?: string;
}
