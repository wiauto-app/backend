import { IsInt, IsNumber, Max, Min } from "class-validator";

export class QuoteVehicleFinancingHttpDto {
  @IsNumber({}, { message: "La entrada debe ser un número." })
  @Min(0, { message: "La entrada no puede ser negativa." })
  @Max(95, { message: "La entrada no puede superar el 95 %." })
  down_payment_percent: number;

  @IsInt({ message: "El plazo debe ser un número entero de meses." })
  @Min(1, { message: "El plazo debe ser de al menos 1 mes." })
  @Max(240, { message: "El plazo no puede superar 240 meses." })
  term_months: number;
}
