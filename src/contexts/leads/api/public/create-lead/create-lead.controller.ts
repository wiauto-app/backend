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

import { GenericLeadsService } from "../../../services/leads.service";
import { V1_LEADS } from "../../route.constants";
import { CreateGenericLeadHttpDto } from "./create-lead.http-dto";

/** Misma forma que `GenericLeadEntity` recién creada, sin persistir. */
const fakeGenericLeadResponse = (body: HoneypotRequestBody) => {
  const now = new Date();
  return {
    id: uuidv4(),
    type: honeypotBodyString(body, "type") ?? "",
    first_name: honeypotBodyString(body, "first_name") ?? "",
    last_name: honeypotBodyString(body, "last_name") ?? "",
    dni: honeypotBodyString(body, "dni"),
    phone: honeypotBodyString(body, "phone") ?? "",
    email: honeypotBodyString(body, "email") ?? "",
    extra_data: {},
    status: "pending",
    created_at: now,
    updated_at: now,
  };
};

@Controller(V1_LEADS)
@OptInThrottle(THROTTLER_NAME.PUBLIC_LEADS, {
  limit: envs.PUBLIC_LEADS_THROTTLE_LIMIT,
  ttl: envs.PUBLIC_LEADS_THROTTLE_TTL_MS,
})
export class CreateGenericLeadController {
  constructor(private readonly leads_service: GenericLeadsService) {}

  @Post()
  @Honeypot(fakeGenericLeadResponse)
  create(@Body() body: CreateGenericLeadHttpDto) {
    return this.leads_service.create(body);
  }
}
