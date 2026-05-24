import { IsNotEmpty, IsNumber, Max, Min, MinLength, IsString } from "class-validator";

/** Imagen en actualización: acepta rutas temporales o definitivas ya publicadas. */
export class UpdateImageHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  path: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  order: number;
}
