import { IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCatalogModelHttpDto {
  @IsInt()
  @IsNotEmpty()
  make_id: number;

  @IsInt()
  @IsNotEmpty()
  model_id: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;
}
