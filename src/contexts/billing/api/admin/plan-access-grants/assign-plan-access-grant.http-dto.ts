import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

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
}
