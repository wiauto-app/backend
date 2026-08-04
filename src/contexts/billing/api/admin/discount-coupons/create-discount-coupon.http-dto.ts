import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class CreateDiscountCouponHttpDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,40}$/i, {
    message: "El código debe tener 3-40 caracteres alfanuméricos",
  })
  code?: string;

  @ValidateIf((dto: CreateDiscountCouponHttpDto) => dto.amount_off_cents == null)
  @IsNumber()
  @Min(1)
  @Max(100)
  percent_off?: number;

  @ValidateIf((dto: CreateDiscountCouponHttpDto) => dto.percent_off == null)
  @IsInt()
  @Min(1)
  amount_off_cents?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_redemptions?: number;

  @IsOptional()
  @IsDateString()
  expires_at?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
