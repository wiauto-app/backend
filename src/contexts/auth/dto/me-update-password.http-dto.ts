import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class MeUpdatePasswordHttpDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
