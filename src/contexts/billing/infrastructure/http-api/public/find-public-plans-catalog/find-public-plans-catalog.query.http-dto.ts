import { IsOptional, IsString } from "class-validator";

export class FindPublicPlansCatalogQueryHttpDto {
  @IsOptional()
  @IsString()
  audience?: string;
}
