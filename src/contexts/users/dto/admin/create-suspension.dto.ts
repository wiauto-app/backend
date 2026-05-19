import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class CreateSuspensionDurationTypeDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsNotEmpty()
  duration_ms: string | null;

  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}