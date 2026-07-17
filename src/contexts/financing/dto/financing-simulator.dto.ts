export type FinancingCurrency = "USD" | "EUR";

export type FinancingInsuranceOptionId = "basic" | "standard" | "premium";

export interface FinancingRangeDto {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface FinancingInsuranceOptionDto {
  id: FinancingInsuranceOptionId | string;
  label: string;
  monthly_amount: number;
}

export interface FinancingSimulatorConfigDto {
  currency: FinancingCurrency;
  vehicle_price: FinancingRangeDto;
  down_payment_percent: FinancingRangeDto;
  term_months: FinancingRangeDto;
  annual_interest_rate: FinancingRangeDto;
  insurance_options: FinancingInsuranceOptionDto[];
}

export interface SimulateFinancingInput {
  vehicle_price: number;
  down_payment_percent: number;
  term_months: number;
  annual_interest_rate: number;
  insurance_option_id?: string | null;
}

export interface FinancingBreakdownDto {
  financed_percent: number;
  interest_percent: number;
  insurance_percent: number;
}

export interface FinancingScheduleItemDto {
  installment: number;
  date: string;
  payment: number;
  remaining_balance: number;
}

export interface SimulateFinancingResultDto {
  down_payment: number;
  financed_amount: number;
  monthly_payment: number;
  monthly_insurance: number;
  monthly_total: number;
  total_interest: number;
  total_insurance: number;
  total_to_pay: number;
  credit_cost: number;
  effective_annual_rate: number;
  breakdown: FinancingBreakdownDto;
  schedule: FinancingScheduleItemDto[];
}
