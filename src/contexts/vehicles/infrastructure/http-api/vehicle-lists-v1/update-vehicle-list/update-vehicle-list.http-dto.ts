import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateVehicleListHttpDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
