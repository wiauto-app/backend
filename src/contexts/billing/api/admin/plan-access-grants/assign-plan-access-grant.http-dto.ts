import { Type } from "class-transformer";
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { AdminDealershipMinimalDto } from "@/src/contexts/dealership/dto/admin-dealership-minimal.dto";

export class AssignPlanAccessGrantHttpDto {
  @IsUUID()
  plan_id!: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;

  /** Solo se usa si el plan es de concesionario y el perfil aún no pertenece a uno. */
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminDealershipMinimalDto)
  dealership?: AdminDealershipMinimalDto;
}
