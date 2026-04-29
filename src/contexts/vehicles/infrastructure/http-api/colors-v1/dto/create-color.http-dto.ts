import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateColorHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: "hex_code debe ser un color hexadecimal de 6 dígitos (ej. #FF0000)",
  })
  hex_code: string;
}
