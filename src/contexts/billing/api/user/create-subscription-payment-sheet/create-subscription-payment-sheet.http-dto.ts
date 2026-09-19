import { Transform, Type } from "class-transformer";
import {
  IsISO31661Alpha2,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from "class-validator";

import { BillingFiscalProfileHttpDto } from "../shared/billing-fiscal-profile.http-dto";

const normalizeCountry = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

export class BillingAddressHttpDto {
  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  @MinLength(1)
  postal_code!: string;

  /** ISO 3166-1 alpha-2, normalized to upper case (e.g. "es" -> "ES"). */
  @Transform(normalizeCountry)
  @IsISO31661Alpha2()
  country!: string;
}

/**
 * Body for POST /v1/billing/subscriptions/payment-sheet.
 *
 * Promotion codes are intentionally NOT supported in v1 of the native flow;
 * they will need an explicit `promotion_code` field resolved server-side.
 */
export class CreateSubscriptionPaymentSheetHttpDto extends BillingFiscalProfileHttpDto {
  @IsUUID()
  plan_price_id!: string;

  // ValidateNested alone accepts undefined, so the object must be required explicitly.
  @IsObject()
  @ValidateNested()
  @Type(() => BillingAddressHttpDto)
  billing_address!: BillingAddressHttpDto;
}
