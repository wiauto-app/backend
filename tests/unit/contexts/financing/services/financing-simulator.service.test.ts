import { BadRequestException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FINANCING_SIMULATOR_CONFIG } from "@/contexts/financing/constants/financing-simulator.defaults";
import { FinancingSimulatorService } from "@/contexts/financing/services/financing-simulator.service";

describe("FinancingSimulatorService", () => {
  let service: FinancingSimulatorService;

  beforeEach(() => {
    service = new FinancingSimulatorService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getConfig", () => {
    it("returns the simulator defaults aligned to the mock", () => {
      const config = service.getConfig();

      expect(config.currency).toBe("USD");
      expect(config.vehicle_price.default).toBe(18990);
      expect(config.down_payment_percent.default).toBe(30);
      expect(config.term_months.default).toBe(60);
      expect(config.annual_interest_rate.default).toBe(9.5);
      expect(config.insurance_options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "standard",
            monthly_amount: 55,
          }),
        ]),
      );
      expect(config).toEqual(FINANCING_SIMULATOR_CONFIG);
    });
  });

  describe("simulate", () => {
    it("calculates french amortization without insurance", () => {
      const result = service.simulate({
        vehicle_price: 18990,
        down_payment_percent: 30,
        term_months: 60,
        annual_interest_rate: 9.5,
      });

      expect(result.down_payment).toBe(5697);
      expect(result.financed_amount).toBe(13293);
      expect(result.monthly_insurance).toBe(0);
      expect(result.monthly_payment).toBeGreaterThan(0);
      expect(result.monthly_total).toBe(result.monthly_payment);
      expect(result.total_insurance).toBe(0);
      expect(result.credit_cost).toBe(result.total_interest);
      expect(result.total_to_pay).toBe(
        result.down_payment +
          result.monthly_payment * 60 +
          result.total_insurance,
      );
      expect(result.schedule).toHaveLength(60);
      expect(result.schedule[0]?.date).toBe("2026-08-17");
      expect(result.schedule.at(-1)?.remaining_balance).toBe(0);
      expect(result.effective_annual_rate).toBeGreaterThan(9.5);
      expect(
        result.breakdown.financed_percent +
          result.breakdown.interest_percent +
          result.breakdown.insurance_percent,
      ).toBeLessThan(100);
    });

    it("splits principal evenly when interest rate is zero", () => {
      const result = service.simulate({
        vehicle_price: 10000,
        down_payment_percent: 20,
        term_months: 10,
        annual_interest_rate: 0,
      });

      expect(result.down_payment).toBe(2000);
      expect(result.financed_amount).toBe(8000);
      expect(result.monthly_payment).toBe(800);
      expect(result.total_interest).toBe(0);
      expect(result.effective_annual_rate).toBe(0);
      expect(result.schedule.every((item) => item.payment === 800)).toBe(true);
      expect(result.schedule.at(-1)?.remaining_balance).toBe(0);
    });

    it("includes standard insurance in monthly total and totals", () => {
      const withoutInsurance = service.simulate({
        vehicle_price: 18990,
        down_payment_percent: 30,
        term_months: 60,
        annual_interest_rate: 9.5,
      });

      const withInsurance = service.simulate({
        vehicle_price: 18990,
        down_payment_percent: 30,
        term_months: 60,
        annual_interest_rate: 9.5,
        insurance_option_id: "standard",
      });

      expect(withInsurance.monthly_insurance).toBe(55);
      expect(withInsurance.monthly_total).toBe(
        withInsurance.monthly_payment + 55,
      );
      expect(withInsurance.total_insurance).toBe(55 * 60);
      expect(withInsurance.credit_cost).toBe(
        withInsurance.total_interest + withInsurance.total_insurance,
      );
      expect(withInsurance.monthly_payment).toBe(
        withoutInsurance.monthly_payment,
      );
      expect(withInsurance.breakdown.insurance_percent).toBeGreaterThan(0);
    });

    it("throws when insurance_option_id is unknown", () => {
      expect(() =>
        service.simulate({
          vehicle_price: 18990,
          down_payment_percent: 30,
          term_months: 60,
          annual_interest_rate: 9.5,
          insurance_option_id: "gold",
        }),
      ).toThrow(BadRequestException);
    });

    it("builds a decreasing remaining balance schedule", () => {
      const result = service.simulate({
        vehicle_price: 20000,
        down_payment_percent: 25,
        term_months: 12,
        annual_interest_rate: 12,
        insurance_option_id: "basic",
      });

      expect(result.schedule).toHaveLength(12);

      for (let index = 1; index < result.schedule.length; index++) {
        const previous = result.schedule[index - 1]!;
        const current = result.schedule[index]!;
        expect(current.remaining_balance).toBeLessThanOrEqual(
          previous.remaining_balance,
        );
        expect(current.installment).toBe(index + 1);
      }
    });
  });
});
