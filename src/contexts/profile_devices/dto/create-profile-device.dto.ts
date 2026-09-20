import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  DevicePlatform,
  PushTokenType,
} from "../entities/profile_devices.entity";

export class CreateProfileDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  /**
   * Proveedor del token. Por defecto `fcm`. En iOS es obligatorio (`expo`):
   * el token APNs crudo no sirve para `firebase-admin`.
   */
  @IsOptional()
  @IsEnum(PushTokenType)
  tokenType?: PushTokenType;

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
