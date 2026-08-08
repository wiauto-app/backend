import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateProfileHttpDto {
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;
}
