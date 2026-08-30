import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum AVAILABLE_PLATFORMS {
  ANDROID = "android",
  IOS = "ios",
}
export class GoogleMobileDto {
  @IsString()
  @IsNotEmpty()
  id_token: string;

  @IsEnum(AVAILABLE_PLATFORMS)
  platform: AVAILABLE_PLATFORMS;
}
