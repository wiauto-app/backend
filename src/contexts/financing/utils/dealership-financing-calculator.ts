export interface DealershipFinancingCalculationInput {
  /** Precio del vehículo en euros. */
  price: number;
  /** Entrada como porcentaje del precio (0-100). */
  down_payment_percent: number;
  term_months: number;
  /** TIN anual en porcentaje. 0 = sin intereses. */
  tin: number;
  /** Comisión de apertura como % del capital financiable. */
  opening_fee_percent: number;
  /** Comisión de apertura fija en euros (se suma a la porcentual). */
  opening_fee_fixed: number | null;
  /** Importe mínimo financiable (precio − entrada). */
  min_financeable_amount: number;
}

export interface DealershipFinancingCalculationResult {
  price: number;
  down_payment_percent: number;
  down_payment: number;
  term_months: number;
  /** Precio − entrada, sin comisión. */
  financeable_amount: number;
  opening_fee: number;
  /** Capital amortizado: financeable_amount + opening_fee. */
  principal: number;
  monthly_payment: number;
  total_interest: number;
  total_payable: number;
}

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Cuota mensual por sistema francés:
 * `C = P · r / (1 − (1 + r)^−n)`; con `r = 0`, `C = P / n`.
 */
export const calculateFrenchMonthlyPayment = (
  principal: number,
  annual_rate_percent: number,
  term_months: number,
): number => {
  if (principal <= 0 || term_months <= 0) {
    return 0;
  }
  const monthly_rate = annual_rate_percent / 100 / 12;
  if (monthly_rate === 0) {
    return principal / term_months;
  }
  return (
    (principal * monthly_rate) / (1 - Math.pow(1 + monthly_rate, -term_months))
  );
};

/**
 * Calcula la cuota orientativa del concesionario. La comisión de apertura se
 * suma al capital y entra en la cuota. Devuelve `null` si el importe
 * financiable queda por debajo del mínimo o los datos no son válidos.
 */
export const calculateDealershipFinancing = (
  input: DealershipFinancingCalculationInput,
): DealershipFinancingCalculationResult | null => {
  if (
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isInteger(input.term_months) ||
    input.term_months <= 0 ||
    input.down_payment_percent < 0 ||
    input.down_payment_percent >= 100
  ) {
    return null;
  }

  const down_payment = roundMoney(
    (input.price * input.down_payment_percent) / 100,
  );
  const financeable_amount = roundMoney(input.price - down_payment);

  if (
    financeable_amount <= 0 ||
    financeable_amount < input.min_financeable_amount
  ) {
    return null;
  }

  const opening_fee = roundMoney(
    (financeable_amount * input.opening_fee_percent) / 100 +
      (input.opening_fee_fixed ?? 0),
  );
  const principal = roundMoney(financeable_amount + opening_fee);

  const monthly_payment = roundMoney(
    calculateFrenchMonthlyPayment(principal, input.tin, input.term_months),
  );
  const total_payable = roundMoney(monthly_payment * input.term_months);
  const total_interest = roundMoney(Math.max(0, total_payable - principal));

  return {
    price: input.price,
    down_payment_percent: input.down_payment_percent,
    down_payment,
    term_months: input.term_months,
    financeable_amount,
    opening_fee,
    principal,
    monthly_payment,
    total_interest,
    total_payable,
  };
};
