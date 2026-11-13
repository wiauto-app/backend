import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export interface AdminCreateUserDealershipInput {
  name: string;
  email: string;
  phone_code: string;
  phone: string;
  address: string;
}

export class AdminCreateUserDealershipDto implements AdminCreateUserDealershipInput {
  @IsString()
  @IsNotEmpty({ message: "El nombre del concesionario es obligatorio." })
  name: string;

  @IsEmail({}, { message: "Introduce un correo electrónico válido." })
  @IsNotEmpty({ message: "El correo del concesionario es obligatorio." })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "El prefijo telefónico es obligatorio." })
  phone_code: string;

  @IsString()
  @Matches(/^\d{6,}$/, {
    message: "El teléfono debe tener al menos 6 dígitos.",
  })
  phone: string;

  @IsString()
  @MinLength(5, {
    message: "La dirección debe tener al menos 5 caracteres.",
  })
  address: string;
}
