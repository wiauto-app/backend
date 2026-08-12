import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { DevicePlatform } from "../entities/profile_devices.entity";

export class CreateProfileDeviceDto {
  @IsString()
  @MaxLength(500)
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  osVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}