import { IsOptional, IsString, MinLength } from "class-validator";

export class LookupVehicleIdentificationHttpDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  plate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  vin?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  country?: string;
}
