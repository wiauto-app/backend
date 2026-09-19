import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

import {
  PROFESSIONAL_ACCOUNT_TYPE,
  ProfessionalAccountType,
} from "../../../types/billing.enums";

/**
 * Fiscal fields shared by every authenticated subscription flow
 * (hosted Checkout and native PaymentSheet). Keep validators here so both
 * DTOs stay in sync.
 */
export class BillingFiscalProfileHttpDto {
  @IsIn(Object.values(PROFESSIONAL_ACCOUNT_TYPE))
  account_type!: ProfessionalAccountType;

  @IsString()
  @MinLength(1)
  legal_name!: string;

  @IsString()
  @MinLength(1)
  tax_id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone_code!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsString()
  commercial_name?: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar los términos y condiciones" })
  accepted_terms!: boolean;
}
