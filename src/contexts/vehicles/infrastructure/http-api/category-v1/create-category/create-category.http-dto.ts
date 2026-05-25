import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  image_url?: string | null;
}
