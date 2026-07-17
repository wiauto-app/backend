import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

import { FINANCING_SIMULATOR_CONFIG } from "../constants/financing-simulator.defaults";

const { vehicle_price, down_payment_percent, term_months, annual_interest_rate } =
  FINANCING_SIMULATOR_CONFIG;

export class SimulateFinancingHttpDto {
  @IsNumber()
  @Min(vehicle_price.min)
  @Max(vehicle_price.max)
  vehicle_price: number;

  @IsNumber()
  @Min(down_payment_percent.min)
  @Max(down_payment_percent.max)
  down_payment_percent: number;

  @IsNumber()
  @Min(term_months.min)
  @Max(term_months.max)
  term_months: number;

  @IsNumber()
  @Min(annual_interest_rate.min)
  @Max(annual_interest_rate.max)
  annual_interest_rate: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  insurance_option_id?: string | null;
}
