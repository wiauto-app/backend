import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AcceptDealershipInvitationHttpDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  /** Si es true, responde JSON en lugar de redirigir (útil para app móvil). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  with_response?: boolean;
}
