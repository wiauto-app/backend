import { IsNotEmpty, IsString, Matches } from "class-validator";

export class VerifyBackupCodeLoginHttpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: "El código de respaldo debe tener el formato XXXX-XXXX",
  })
  code: string;
}
