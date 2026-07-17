import {
  CONDITION_VEHICLE,
  ConditionVehicle,
  PUBLISHER_TYPE,
  PublisherType,
  TRANSMISSION_TYPE,
  TransmissionType,
} from "@/src/contexts/vehicles/types/vehicle";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

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

export class GenerationSettingsHttpDto {
  @IsOptional()
  @IsIn(GENERATION_OBJECTIVE_CODES)
  objective?: string | null;

  @IsOptional()
  @IsIn(GENERATION_PERSUASION_CODES)
  persuasion?: string | null;

  @IsOptional()
  @IsIn(GENERATION_EXTENSION_CODES)
  extension?: string | null;

  @IsOptional()
  @IsIn(GENERATION_TONE_CODES)
  tone?: string | null;
}

export class VehicleAiContextHttpDto {
  @IsNumber()
  @IsNotEmpty()
  version_id: number;

  @IsEnum(CONDITION_VEHICLE)
  @IsNotEmpty()
  condition: ConditionVehicle;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  mileage: number;

  @IsEnum(TRANSMISSION_TYPE)
  @IsNotEmpty()
  transmission_type: TransmissionType;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  power: number;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displacement?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  vehicle_type_id?: string | null;

  @IsOptional()
  @IsEnum(PUBLISHER_TYPE)
  publisher_type?: PublisherType;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  color_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  category_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  dgt_label_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  traction_id?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  autonomy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  battery_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  time_to_charge?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GenerationSettingsHttpDto)
  settings?: GenerationSettingsHttpDto;
}

