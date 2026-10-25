import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { HoneypotHttpDto } from "@/src/common/antispam/honeypot";

export class CreatePlanContactLeadHttpDto extends HoneypotHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  source?: string;
}
