import { IsOptional, IsString, IsUUID } from "class-validator";


export class AdminUpdateProfileHttpDto {
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
