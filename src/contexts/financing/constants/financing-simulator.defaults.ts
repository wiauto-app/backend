import type { FinancingSimulatorConfigDto } from "../dto/financing-simulator.dto";

export const FINANCING_SIMULATOR_CONFIG: FinancingSimulatorConfigDto = {
  currency: "USD",
  vehicle_price: {
    min: 5000,
    max: 150000,
    step: 100,
    default: 18990,
  },
  down_payment_percent: {
    min: 0,
    max: 70,
    step: 1,
    default: 30,
  },
  term_months: {
    min: 12,
    max: 84,
    step: 12,
    default: 60,
  },
  annual_interest_rate: {
    min: 0,
    max: 25,
    step: 0.5,
    default: 9.5,
  },
  insurance_options: [
    {
      id: "basic",
      label: "Básico",
      monthly_amount: 35,
    },
    {
      id: "standard",
      label: "Estándar",
      monthly_amount: 55,
    },
    {
      id: "premium",
      label: "Premium",
      monthly_amount: 85,
    },
  ],
};
