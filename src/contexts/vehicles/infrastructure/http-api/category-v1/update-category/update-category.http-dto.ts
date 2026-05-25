import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  image_url?: string | null;
}
