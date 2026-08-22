import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateMyProfileHttpDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres" })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: "El apellido debe tener al menos 2 caracteres" })
  last_name?: string;

  @IsOptional()
  @IsString()
  phone_code?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
