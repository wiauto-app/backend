import { IsNotEmpty, IsString } from "class-validator";

export class CreateDgtLabelHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Distintivo ambiental DGT (ej. 0, ECO, C, B). Se normaliza a mayúsculas. */
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
