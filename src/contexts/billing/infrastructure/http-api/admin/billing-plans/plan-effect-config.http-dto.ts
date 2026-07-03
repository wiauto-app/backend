import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class PlanEffectConfigHttpDto {
  @IsOptional()
  @IsIn(["assistant_credits", "feature_vehicle", "none"])
  type?: "assistant_credits" | "feature_vehicle" | "none";

  @ValidateIf((dto: PlanEffectConfigHttpDto) => dto.type === "assistant_credits")
  @IsInt()
  @Min(1)
  credits?: number;
}

export const normalizePlanEffectConfig = (
  effect_config?: PlanEffectConfigHttpDto | null,
): Record<string, unknown> => {
  if (!effect_config?.type || effect_config.type === "none") {
    return {};
  }

  if (effect_config.type === "assistant_credits") {
    return {
      type: "assistant_credits",
      credits: effect_config.credits,
    };
  }

  return { type: "feature_vehicle" };
};
