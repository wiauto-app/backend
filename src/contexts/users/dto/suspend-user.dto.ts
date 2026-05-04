import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SuspendUserBodyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: "El motivo debe tener al menos 5 caracteres" })
  @MaxLength(2000, { message: "El motivo no puede superar 2000 caracteres" })
  reason: string;

  @IsUUID("4")
  @IsNotEmpty()
  suspension_duration_type_id: string;
}
