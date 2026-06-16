import { IsOptional, IsString, ValidateIf } from "class-validator";

export class UpdateProvinceHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  image_url?: string | null;
}
