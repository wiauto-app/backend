import { BadRequestException, Injectable } from "@nestjs/common";

import { FINANCING_SIMULATOR_CONFIG } from "../constants/financing-simulator.defaults";
import type {
  FinancingSimulatorConfigDto,
  FinancingScheduleItemDto,
  SimulateFinancingInput,
  SimulateFinancingResultDto,
} from "../dto/financing-simulator.dto";

const round2 = (value: number): number => Math.round(value * 100) / 100;

const round4 = (value: number): number => Math.round(value * 10000) / 10000;

const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class FinancingSimulatorService {
  getConfig(): FinancingSimulatorConfigDto {
    return FINANCING_SIMULATOR_CONFIG;
  }

  simulate(input: SimulateFinancingInput): SimulateFinancingResultDto {
    const monthlyInsurance = this.resolveMonthlyInsurance(
      input.insurance_option_id,
    );

    const downPayment = round2(
      input.vehicle_price * (input.down_payment_percent / 100),
    );
    const financedAmount = round2(input.vehicle_price - downPayment);
    const monthlyPayment = round2(
      this.calculateMonthlyPayment(
        financedAmount,
        input.annual_interest_rate,
        input.term_months,
      ),
    );

    const schedule = this.buildSchedule({
      financedAmount,
      monthlyPayment,
      annualInterestRate: input.annual_interest_rate,
      termMonths: input.term_months,
      startDate: new Date(),
    });

    const totalCreditPayments = round2(monthlyPayment * input.term_months);
    const totalInterest = round2(
      Math.max(0, totalCreditPayments - financedAmount),
    );
    const totalInsurance = round2(monthlyInsurance * input.term_months);
    const monthlyTotal = round2(monthlyPayment + monthlyInsurance);
    const totalToPay = round2(
      downPayment + totalCreditPayments + totalInsurance,
    );
    const creditCost = round2(totalInterest + totalInsurance);
    const effectiveAnnualRate = round4(
      this.calculateEffectiveAnnualRate(input.annual_interest_rate),
    );

    const financedPercent =
      totalToPay > 0 ? round2((financedAmount / totalToPay) * 100) : 0;
    const interestPercent =
      totalToPay > 0 ? round2((totalInterest / totalToPay) * 100) : 0;
    const insurancePercent =
      totalToPay > 0 ? round2((totalInsurance / totalToPay) * 100) : 0;

    return {
      down_payment: downPayment,
      financed_amount: financedAmount,
      monthly_payment: monthlyPayment,
      monthly_insurance: monthlyInsurance,
      monthly_total: monthlyTotal,
      total_interest: totalInterest,
      total_insurance: totalInsurance,
      total_to_pay: totalToPay,
      credit_cost: creditCost,
      effective_annual_rate: effectiveAnnualRate,
      breakdown: {
        financed_percent: financedPercent,
        interest_percent: interestPercent,
        insurance_percent: insurancePercent,
      },
      schedule,
    };
  }

  private resolveMonthlyInsurance(
    insuranceOptionId?: string | null,
  ): number {
    if (insuranceOptionId == null || insuranceOptionId === "") {
      return 0;
    }

    const option = FINANCING_SIMULATOR_CONFIG.insurance_options.find(
      (item) => item.id === insuranceOptionId,
    );

    if (!option) {
      throw new BadRequestException(
        `Opción de seguro inválida: ${insuranceOptionId}`,
      );
    }

    return option.monthly_amount;
  }

  private calculateMonthlyPayment(
    financedAmount: number,
    annualInterestRate: number,
    termMonths: number,
  ): number {
    if (financedAmount <= 0 || termMonths <= 0) {
      return 0;
    }

    if (annualInterestRate === 0) {
      return financedAmount / termMonths;
    }

    const monthlyRate = annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, termMonths);

    return (financedAmount * (monthlyRate * factor)) / (factor - 1);
  }

  private calculateEffectiveAnnualRate(annualInterestRate: number): number {
    if (annualInterestRate === 0) {
      return 0;
    }

    const monthlyRate = annualInterestRate / 100 / 12;
    return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
  }

  private buildSchedule(options: {
    financedAmount: number;
    monthlyPayment: number;
    annualInterestRate: number;
    termMonths: number;
    startDate: Date;
  }): FinancingScheduleItemDto[] {
    const {
      financedAmount,
      monthlyPayment,
      annualInterestRate,
      termMonths,
      startDate,
    } = options;

    if (termMonths <= 0) {
      return [];
    }

    const monthlyRate = annualInterestRate / 100 / 12;
    let remainingBalance = financedAmount;
    const schedule: FinancingScheduleItemDto[] = [];

    for (let installment = 1; installment <= termMonths; installment++) {
      const interestPortion =
        annualInterestRate === 0 ? 0 : remainingBalance * monthlyRate;
      let payment = monthlyPayment;
      let principalPortion = payment - interestPortion;

      if (installment === termMonths) {
        principalPortion = remainingBalance;
        payment = round2(principalPortion + interestPortion);
      }

      remainingBalance = Math.max(0, remainingBalance - principalPortion);

      schedule.push({
        installment,
        date: toIsoDate(addMonths(startDate, installment)),
        payment: round2(payment),
        remaining_balance: round2(remainingBalance),
      });
    }

    return schedule;
  }
}
