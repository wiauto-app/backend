import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

import {
  PROFESSIONAL_ACCOUNT_TYPE,
  ProfessionalAccountType,
} from "../../../types/billing.enums";

export class CreateSubscriptionCheckoutHttpDto {
  @IsUUID()
  plan_price_id!: string;

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
