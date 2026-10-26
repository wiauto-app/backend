import { describe, expect, it } from "vitest";

import { calculateDealershipFinancing } from "@/src/contexts/financing/utils/dealership-financing-calculator";

const base = {
  price: 12_000,
  down_payment_percent: 0,
  term_months: 12,
  tin: 0,
  opening_fee_percent: 0,
  opening_fee_fixed: 0,
  min_financeable_amount: 0,
};

describe("calculateDealershipFinancing", () => {
  it("con TIN 0 reparte el capital a partes iguales", () => {
    const result = calculateDealershipFinancing(base);

    expect(result).toMatchObject({
      financeable_amount: 12_000,
      opening_fee: 0,
      principal: 12_000,
      monthly_payment: 1_000,
      total_interest: 0,
      total_payable: 12_000,
    });
  });

  it("suma la comisión de apertura al capital de la cuota", () => {
    const result = calculateDealershipFinancing({
      ...base,
      price: 10_000,
      term_months: 10,
      opening_fee_percent: 10,
      opening_fee_fixed: 100,
    });

    expect(result).toMatchObject({
      financeable_amount: 10_000,
      opening_fee: 1_100,
      principal: 11_100,
      monthly_payment: 1_110,
      total_interest: 0,
    });
  });

  it("calcula la cuota francesa para un plazo con intereses", () => {
    const result = calculateDealershipFinancing({
      ...base,
      price: 10_000,
      tin: 12,
      term_months: 12,
    });

    expect(result).toMatchObject({
      principal: 10_000,
      monthly_payment: 888.49,
      total_payable: 10_661.88,
      total_interest: 661.88,
      term_months: 12,
    });
  });

  it("no financia si el importe financiable queda por debajo del mínimo", () => {
    const below_minimum = calculateDealershipFinancing({
      ...base,
      price: 5_000,
      down_payment_percent: 20,
      min_financeable_amount: 5_000,
    });
    const at_minimum = calculateDealershipFinancing({
      ...base,
      price: 5_000,
      down_payment_percent: 0,
      min_financeable_amount: 5_000,
    });

    expect(below_minimum).toBeNull();
    expect(at_minimum?.financeable_amount).toBe(5_000);
    expect(at_minimum?.monthly_payment).toBe(416.67);
  });
});
