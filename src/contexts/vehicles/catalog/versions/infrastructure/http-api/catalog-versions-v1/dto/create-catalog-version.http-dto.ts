import { IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCatalogVersionHttpDto {
  @IsInt()
  @IsNotEmpty()
  make_id: number;

  @IsInt()
  @IsNotEmpty()
  model_id: number;

  @IsInt()
  @IsNotEmpty()
  body_type_id: number;

  @IsInt()
  @IsNotEmpty()
  fuel_type_id: number;

  @IsInt()
  @IsNotEmpty()
  year_id: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;
}
