export interface DealershipFinancingSettingsResponse {
  dealership_id: string;
  /** `false` si el concesionario aún no ha guardado condiciones. */
  configured: boolean;
  enabled: boolean;
  financial_entity: string | null;
  tin: number;
  declared_tae: number | null;
  min_term_months: number;
  max_term_months: number;
  default_term_months: number;
  default_down_payment_percent: number;
  min_down_payment_percent: number;
  max_down_payment_percent: number;
  min_financeable_amount: number;
  opening_fee_percent: number;
  opening_fee_fixed: number | null;
  other_conditions: string | null;
}
