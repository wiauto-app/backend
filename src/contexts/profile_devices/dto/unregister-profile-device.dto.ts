import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UnregisterProfileDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  token: string;
}
