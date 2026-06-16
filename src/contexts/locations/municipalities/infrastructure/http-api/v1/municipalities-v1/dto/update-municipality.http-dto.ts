import { IsOptional, IsString, ValidateIf } from "class-validator";

export class UpdateMunicipalityHttpDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  name?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  image_url?: string | null;
}
