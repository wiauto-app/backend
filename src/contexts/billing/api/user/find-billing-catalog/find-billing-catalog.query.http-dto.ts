import { IsOptional, IsString } from "class-validator";

export class FindBillingCatalogQueryHttpDto {
  @IsOptional()
  @IsString()
  audience?: string;
}
