import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;
  @IsString()
  @IsNotEmpty()
  icon: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  body: string;
}