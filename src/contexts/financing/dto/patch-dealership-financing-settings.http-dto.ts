import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class PatchDealershipFinancingSettingsHttpDto {
  @IsOptional()
  @IsBoolean({ message: "Indica si la financiación está activa." })
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "La entidad financiera debe ser un texto." })
  @MaxLength(120, { message: "La entidad financiera es demasiado larga." })
  financial_entity?: string | null;

  @IsOptional()
  @IsNumber({}, { message: "El TIN debe ser un número." })
  @Min(0, { message: "El TIN no puede ser negativo." })
  @Max(60, { message: "El TIN no puede superar el 60 %." })
  tin?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: "La TAE debe ser un número." })
  @Min(0, { message: "La TAE no puede ser negativa." })
  @Max(100, { message: "La TAE no puede superar el 100 %." })
  declared_tae?: number | null;

  @IsOptional()
  @IsInt({ message: "El plazo mínimo debe ser un número entero de meses." })
  @Min(1, { message: "El plazo mínimo debe ser de al menos 1 mes." })
  @Max(240, { message: "El plazo mínimo no puede superar 240 meses." })
  min_term_months?: number;

  @IsOptional()
  @IsInt({ message: "El plazo máximo debe ser un número entero de meses." })
  @Min(1, { message: "El plazo máximo debe ser de al menos 1 mes." })
  @Max(240, { message: "El plazo máximo no puede superar 240 meses." })
  max_term_months?: number;

  @IsOptional()
  @IsInt({ message: "El plazo por defecto debe ser un número entero de meses." })
  @Min(1, { message: "El plazo por defecto debe ser de al menos 1 mes." })
  @Max(240, { message: "El plazo por defecto no puede superar 240 meses." })
  default_term_months?: number;

  @IsOptional()
  @IsNumber({}, { message: "La entrada por defecto debe ser un número." })
  @Min(0, { message: "La entrada por defecto no puede ser negativa." })
  @Max(95, { message: "La entrada por defecto no puede superar el 95 %." })
  default_down_payment_percent?: number;

  @IsOptional()
  @IsNumber({}, { message: "La entrada mínima debe ser un número." })
  @Min(0, { message: "La entrada mínima no puede ser negativa." })
  @Max(95, { message: "La entrada mínima no puede superar el 95 %." })
  min_down_payment_percent?: number;

  @IsOptional()
  @IsNumber({}, { message: "La entrada máxima debe ser un número." })
  @Min(0, { message: "La entrada máxima no puede ser negativa." })
  @Max(95, { message: "La entrada máxima no puede superar el 95 %." })
  max_down_payment_percent?: number;

  @IsOptional()
  @IsNumber({}, { message: "El importe mínimo financiable debe ser un número." })
  @Min(0, { message: "El importe mínimo financiable no puede ser negativo." })
  @Max(9_999_999, { message: "El importe mínimo financiable es demasiado alto." })
  min_financeable_amount?: number;

  @IsOptional()
  @IsNumber({}, { message: "La comisión de apertura debe ser un número." })
  @Min(0, { message: "La comisión de apertura no puede ser negativa." })
  @Max(20, { message: "La comisión de apertura no puede superar el 20 %." })
  opening_fee_percent?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: "La comisión fija debe ser un número." })
  @Min(0, { message: "La comisión fija no puede ser negativa." })
  @Max(99_999, { message: "La comisión fija es demasiado alta." })
  opening_fee_fixed?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "Las otras condiciones deben ser un texto." })
  @MaxLength(1000, { message: "Las otras condiciones no pueden superar 1000 caracteres." })
  other_conditions?: string | null;
}
