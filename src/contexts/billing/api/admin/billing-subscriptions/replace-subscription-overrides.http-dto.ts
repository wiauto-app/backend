import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsString,
  ValidateNested,
} from "class-validator";

import {
  ENTITLEMENT_VALUE_TYPE,
  FEATURE_CATALOG,
} from "../../../types/entitlement-features";

const FEATURE_KEYS = FEATURE_CATALOG.map((item) => item.feature);
const VALUE_TYPES = Object.values(ENTITLEMENT_VALUE_TYPE);

export class SubscriptionOverrideItemHttpDto {
  @IsString()
  @IsIn(FEATURE_KEYS)
  feature!: string;

  @IsString()
  @IsIn(VALUE_TYPES)
  value_type!: (typeof VALUE_TYPES)[number];

  @IsObject()
  value!: Record<string, unknown>;
}

export class ReplaceSubscriptionOverridesHttpDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionOverrideItemHttpDto)
  overrides!: SubscriptionOverrideItemHttpDto[];
}
