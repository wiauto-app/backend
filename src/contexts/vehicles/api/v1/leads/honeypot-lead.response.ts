import {
  type HoneypotRequestBody,
  type HoneypotRouteParams,
  honeypotBodyString,
} from "@/src/common/antispam/honeypot";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { LEAD_TIER } from "../../../types/lead-scoring";
import { LEAD_TYPE, type LeadType, type PrimitiveLead } from "../../../types/lead";

interface HoneypotLeadResponse {
  lead: PrimitiveLead;
  chat_id: null;
}

/**
 * Misma forma que `LeadsService.createContact/createCallMe` para respuestas
 * falsas del honeypot (nada se persiste ni se notifica).
 */
const fakeLeadResponse = (
  type: LeadType,
  body: HoneypotRequestBody,
  params: HoneypotRouteParams,
): HoneypotLeadResponse => {
  const now = new Date();
  return {
    lead: {
      id: uuidv4(),
      vehicle_id: params.vehicle_id ?? "",
      type,
      name: honeypotBodyString(body, "name") ?? "",
      email: honeypotBodyString(body, "email"),
      phone: honeypotBodyString(body, "phone"),
      phone_code: honeypotBodyString(body, "phone_code"),
      message: honeypotBodyString(body, "message"),
      callback_scheduled_at: null,
      created_at: now,
      updated_at: now,
      profile_id: null,
      seller_profile_id: uuidv4(),
      dealership_id: null,
      chat_id: null,
      ai_replied_at: null,
      ai_reply_channel: null,
      score: 0,
      tier: LEAD_TIER.COLD,
      score_signals: [],
      scored_at: null,
      financing_snapshot: null,
    },
    chat_id: null,
  };
};

export const fakeContactLeadResponse = (
  body: HoneypotRequestBody,
  params: HoneypotRouteParams,
): HoneypotLeadResponse => fakeLeadResponse(LEAD_TYPE.CONTACT, body, params);

export const fakeCallMeLeadResponse = (
  body: HoneypotRequestBody,
  params: HoneypotRouteParams,
): HoneypotLeadResponse => fakeLeadResponse(LEAD_TYPE.CALL_ME, body, params);

export const fakeFinancingLeadResponse = (
  body: HoneypotRequestBody,
  params: HoneypotRouteParams,
): HoneypotLeadResponse => fakeLeadResponse(LEAD_TYPE.FINANCING, body, params);
