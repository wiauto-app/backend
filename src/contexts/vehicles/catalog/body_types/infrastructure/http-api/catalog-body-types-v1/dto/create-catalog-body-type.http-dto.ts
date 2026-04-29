import { IsInt, IsNotEmpty, IsString, Min, MinLength } from "class-validator";

export class CreateCatalogBodyTypeHttpDto {
  @IsInt()
  @IsNotEmpty()
  body_type_id: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  doors: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;
}
