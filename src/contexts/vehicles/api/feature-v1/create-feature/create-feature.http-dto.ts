import { IsIn, IsNotEmpty, IsString } from "class-validator";

import { FEATURE_UI_CATEGORY_SLUGS } from "@/src/contexts/vehicles/catalog/features/feature-category.constants";

export class CreateFeatureHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn([...FEATURE_UI_CATEGORY_SLUGS], {
    message: "La categoría de equipamiento no es válida",
  })
  category: string;
}
