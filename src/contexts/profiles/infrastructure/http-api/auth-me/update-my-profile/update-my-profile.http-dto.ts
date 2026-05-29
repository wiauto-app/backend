import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMyProfileHttpDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  last_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
