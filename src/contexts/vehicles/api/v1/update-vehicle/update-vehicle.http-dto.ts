import { CreateVehicleDto } from "../create-vehicle/create-vehicle.http-dto";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { UpdateImageHttpDto } from "./update-image.http-dto";

export class UpdateVehicleHttpDto extends PartialType(
  OmitType(CreateVehicleDto, ["images", "tracking"] as const),
) {
  @IsOptional()
  @IsUUID("4", { message: "El precio del vehículo no es válido." })
  vehicle_price_id?: string;

  @IsOptional()
  @IsArray({ message: "Las fotos no son válidas." })
  @ValidateNested({ each: true, message: "Alguna foto no es válida." })
  @Type(() => UpdateImageHttpDto)
  images?: UpdateImageHttpDto[];
}
