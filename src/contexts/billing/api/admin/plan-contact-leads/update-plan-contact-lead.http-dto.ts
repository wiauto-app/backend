import { IsEnum } from "class-validator";

import {
  PLAN_CONTACT_LEAD_STATUS,
  PlanContactLeadStatus,
} from "../../../types/billing.enums";

export class UpdatePlanContactLeadHttpDto {
  @IsEnum(PLAN_CONTACT_LEAD_STATUS)
  status!: PlanContactLeadStatus;
}
