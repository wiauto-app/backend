import { IsOptional, IsString } from "class-validator";
import { IsUUID } from "class-validator";

export class AdminCreateProfileHttpDto {
  @IsUUID("4")
  id: string;

  @IsString()
  name: string;

  @IsString()
  last_name: string;

  @IsUUID("4")
  role_id:string;

  @IsOptional()
  @IsString()
  avatar_url?:string;

  @IsOptional()
  @IsString()
  image_url?:string;
}