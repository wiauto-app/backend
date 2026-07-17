import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVehicleListHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
