import { Body, Controller, Post } from "@nestjs/common";

import {
  Honeypot,
  type HoneypotRequestBody,
  honeypotBodyString,
} from "@/src/common/antispam/honeypot";
import { OptInThrottle } from "@/src/common/antispam/opt-in-throttle.decorator";
import { THROTTLER_NAME } from "@/src/common/antispam/throttler-names";
import { envs } from "@/src/common/envs";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { PlanContactLeadsService } from "../../../services/plan-contact-leads.service";
import {
  PLAN_CONTACT_LEAD_SOURCE,
  PLAN_CONTACT_LEAD_STATUS,
} from "../../../types/billing.enums";
import { V1_PUBLIC_BILLING_PLAN_CONTACT_LEADS } from "../../route.constants";

import { CreatePlanContactLeadHttpDto } from "./create-plan-contact-lead.http-dto";

/** Misma forma que `PlanContactLeadEntity` recién creada, sin persistir. */
const fakePlanContactLeadResponse = (body: HoneypotRequestBody) => {
  const now = new Date();
  return {
    id: uuidv4(),
    phone: honeypotBodyString(body, "phone") ?? "",
    source: honeypotBodyString(body, "source") ?? PLAN_CONTACT_LEAD_SOURCE.PLANES,
    status: PLAN_CONTACT_LEAD_STATUS.PENDING,
    created_at: now,
    updated_at: now,
  };
};

@Controller(V1_PUBLIC_BILLING_PLAN_CONTACT_LEADS)
@OptInThrottle(THROTTLER_NAME.PUBLIC_LEADS, {
  limit: envs.PUBLIC_LEADS_THROTTLE_LIMIT,
  ttl: envs.PUBLIC_LEADS_THROTTLE_TTL_MS,
})
export class CreatePlanContactLeadController {
  constructor(
    private readonly plan_contact_leads_service: PlanContactLeadsService,
  ) {}

  @Post()
  @Honeypot(fakePlanContactLeadResponse)
  create(@Body() body: CreatePlanContactLeadHttpDto) {
    return this.plan_contact_leads_service.create(body);
  }
}
