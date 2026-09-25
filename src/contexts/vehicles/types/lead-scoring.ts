export const LEAD_TIER = {
  HOT: "hot",
  WARM: "warm",
  COLD: "cold",
} as const;

export type LeadTier = (typeof LEAD_TIER)[keyof typeof LEAD_TIER];

export const LEAD_TIERS: readonly LeadTier[] = Object.values(LEAD_TIER);

export const LEAD_SCORE_SIGNAL = {
  CALL_REQUESTED: "call_requested",
  APPOINTMENT: "appointment",
  FINANCING: "financing",
  PURCHASE_INTENT: "purchase_intent",
  TRADE_IN: "trade_in",
  AVAILABILITY: "availability",
  DETAILED_MESSAGE: "detailed_message",
  VERIFIED_ACCOUNT: "verified_account",
  PHONE_PROVIDED: "phone_provided",
  ENGAGED_CHAT: "engaged_chat",
  FAST_RESPONSE: "fast_response",
  REPEAT_INTEREST: "repeat_interest",
  AI_HOT: "ai_hot",
  LOW_DETAIL: "low_detail",
} as const;

export type LeadScoreSignal =
  (typeof LEAD_SCORE_SIGNAL)[keyof typeof LEAD_SCORE_SIGNAL];

export const LEAD_SORT_BY = {
  DATE: "date",
  SCORE: "score",
} as const;

export type LeadSortBy = (typeof LEAD_SORT_BY)[keyof typeof LEAD_SORT_BY];

export interface LeadScoringView {
  score: number;
  tier: LeadTier;
  signals: LeadScoreSignal[];
  scored_at: Date | null;
}
