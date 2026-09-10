import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateProfileDto {
  @IsUUID("4")
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone_code?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
