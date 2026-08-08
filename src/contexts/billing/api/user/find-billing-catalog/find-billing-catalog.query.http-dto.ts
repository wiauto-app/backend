import { IsEnum, IsOptional } from "class-validator";

import { BILLING_TYPE, BillingType } from "../../../types/billing.enums";

export class FindBillingCatalogQueryHttpDto {
  @IsOptional()
  @IsEnum(BILLING_TYPE)
  billing_type?: BillingType;
}
