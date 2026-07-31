import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export const PLAN_LEAD_CARS_QUANTITY_VALUES = [
  "1-10",
  "11-20",
  "21-50",
  "51-100",
  "101+",
] as const;

export type PlanLeadCarsQuantity =
  (typeof PLAN_LEAD_CARS_QUANTITY_VALUES)[number];

export class CreatePlanLeadRequestHttpDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsIn(PLAN_LEAD_CARS_QUANTITY_VALUES)
  cars_quantity!: PlanLeadCarsQuantity;

  @IsOptional()
  @IsString()
  message?: string;
}
