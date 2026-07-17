import { IsBoolean, IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCatalogFuelTypeHttpDto {
  @IsInt()
  @IsNotEmpty()
  fuel_id: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  can_charge: boolean;
}
