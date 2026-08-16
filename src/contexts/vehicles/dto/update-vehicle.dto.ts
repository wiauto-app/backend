import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "../api/v1/create-vehicle/create-vehicle.http-dto";
import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsUUID("4")
  vehicle_price_id?: string;
}
