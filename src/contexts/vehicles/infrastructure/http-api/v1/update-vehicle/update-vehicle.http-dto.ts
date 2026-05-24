import { CreateVehicleHttpDto } from "../create-vehicle/create-vehicle.http-dto";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { UpdateImageHttpDto } from "./update-image.http-dto";

export class UpdateVehicleHttpDto extends PartialType(
  OmitType(CreateVehicleHttpDto, ["images"] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImageHttpDto)
  images?: UpdateImageHttpDto[];
}
