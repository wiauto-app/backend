import { IsOptional, IsString, MinLength } from "class-validator";

export class CreatePlanContactLeadHttpDto {
  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  source?: string;
}
