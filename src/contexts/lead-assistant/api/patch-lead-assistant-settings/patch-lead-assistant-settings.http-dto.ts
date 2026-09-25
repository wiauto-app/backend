import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import { LEAD_ASSISTANT_REPLY_DELAY_SECONDS } from "../../entities/lead-assistant-settings.entity";

const GENERATION_OBJECTIVE_CODES = [
  "family",
  "young",
  "first-car",
  "business",
  "uber",
  "adventurer",
  "fuel-saver",
  "collector",
  "athlete",
  "anyone",
] as const;

const GENERATION_PERSUASION_CODES = [
  "informative",
  "balanced",
  "persuasive",
  "very-seller",
] as const;

const GENERATION_EXTENSION_CODES = [
  "very-short",
  "short",
  "medium",
  "long",
  "very-detailed",
] as const;

const GENERATION_TONE_CODES = [
  "formal",
  "professional",
  "casual",
  "close",
  "friendly",
  "enthusiastic",
  "elegant",
  "premium",
  "sporty",
  "persuasive",
  "urgent",
  "exclusive",
] as const;

export class PatchLeadAssistantSettingsHttpDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context_note?: string;

  @IsOptional()
  @IsIn(GENERATION_OBJECTIVE_CODES)
  objective?: string;

  @IsOptional()
  @IsIn(GENERATION_PERSUASION_CODES)
  persuasion?: string;

  @IsOptional()
  @IsIn(GENERATION_EXTENSION_CODES)
  extension?: string;

  @IsOptional()
  @IsIn(GENERATION_TONE_CODES)
  tone?: string;

  @IsOptional()
  @IsInt()
  @IsIn([...LEAD_ASSISTANT_REPLY_DELAY_SECONDS])
  reply_delay_seconds?: number;

  @IsOptional()
  @IsBoolean()
  notify_on_reply?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_on_quota_exhausted?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_on_hot_lead?: boolean;
}
