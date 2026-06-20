import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class PlanFeatureHttpDto {
  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  included?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
