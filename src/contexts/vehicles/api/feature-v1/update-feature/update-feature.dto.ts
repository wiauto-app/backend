import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { FEATURE_CATEGORY_STORAGE_SLUGS } from "@/src/contexts/vehicles/catalog/features/feature-category.constants";

export class UpdateFeatureHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn([...FEATURE_CATEGORY_STORAGE_SLUGS], {
    message: "La categoría de equipamiento no es válida",
  })
  category?: string;
}
