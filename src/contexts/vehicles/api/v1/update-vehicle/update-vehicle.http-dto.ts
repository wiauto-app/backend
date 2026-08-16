import { CreateVehicleDto } from "../create-vehicle/create-vehicle.http-dto";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { UpdateImageHttpDto } from "./update-image.http-dto";

export class UpdateVehicleHttpDto extends PartialType(
  OmitType(CreateVehicleDto, ["images"] as const),
) {
  @IsOptional()
  @IsUUID("4")
  vehicle_price_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImageHttpDto)
  images?: UpdateImageHttpDto[];
}
