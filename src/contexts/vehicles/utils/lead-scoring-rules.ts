import { LEAD_TYPE, type LeadType } from "../types/lead";
import {
  LEAD_SCORE_SIGNAL,
  LEAD_TIER,
  type LeadScoreSignal,
  type LeadTier,
} from "../types/lead-scoring";

export const LEAD_HOT_MIN_SCORE = 60;
export const LEAD_WARM_MIN_SCORE = 30;
export const LEAD_DETAILED_MESSAGE_MIN_LENGTH = 120;
export const LEAD_LOW_DETAIL_MAX_LENGTH = 20;
export const LEAD_ENGAGED_CHAT_MIN_MESSAGES = 3;
export const LEAD_FAST_RESPONSE_MAX_MINUTES = 15;

const BASE_SCORE = 10;

const SIGNAL_POINTS: Record<LeadScoreSignal, number> = {
  [LEAD_SCORE_SIGNAL.CALL_REQUESTED]: 25,
  [LEAD_SCORE_SIGNAL.APPOINTMENT]: 20,
  [LEAD_SCORE_SIGNAL.FINANCING]: 15,
  [LEAD_SCORE_SIGNAL.PURCHASE_INTENT]: 15,
  [LEAD_SCORE_SIGNAL.TRADE_IN]: 10,
  [LEAD_SCORE_SIGNAL.AVAILABILITY]: 5,
  [LEAD_SCORE_SIGNAL.DETAILED_MESSAGE]: 5,
  [LEAD_SCORE_SIGNAL.VERIFIED_ACCOUNT]: 10,
  [LEAD_SCORE_SIGNAL.PHONE_PROVIDED]: 5,
  [LEAD_SCORE_SIGNAL.ENGAGED_CHAT]: 10,
  [LEAD_SCORE_SIGNAL.FAST_RESPONSE]: 10,
  [LEAD_SCORE_SIGNAL.REPEAT_INTEREST]: 5,
  [LEAD_SCORE_SIGNAL.AI_HOT]: 20,
  [LEAD_SCORE_SIGNAL.LOW_DETAIL]: -5,
};

/** Patrones sobre texto normalizado (minúsculas, sin tildes). */
const KEYWORD_SIGNALS: ReadonlyArray<{
  signal: LeadScoreSignal;
  pattern: RegExp;
}> = [
  {
    signal: LEAD_SCORE_SIGNAL.APPOINTMENT,
    pattern:
      /\b(citas?|visita\w*|ir a verlo|pasar a verlo|verlo en persona|quedar|prueba de conduccion|probarlo|probar el coche|test drive)\b/,
  },
  {
    signal: LEAD_SCORE_SIGNAL.FINANCING,
    pattern: /\b(financ\w*|cuotas?|plazos|mensualidad\w*|entrada inicial|leasing|renting)\b/,
  },
  {
    signal: LEAD_SCORE_SIGNAL.PURCHASE_INTENT,
    pattern:
      /\b(reserv\w*|senal|lo compro|quiero comprar\w*|cerrar (el )?trato|precio final|ultimo precio|hacer una oferta|te ofrezco|transferencia|papeles)\b/,
  },
  {
    signal: LEAD_SCORE_SIGNAL.TRADE_IN,
    pattern: /\b(parte de pago|entregar mi coche|dejar mi coche|tasacion|cambio por mi)\b/,
  },
  {
    signal: LEAD_SCORE_SIGNAL.AVAILABILITY,
    pattern: /\b(sigue disponible|esta disponible|todavia (lo )?(tienes|tiene)|aun disponible)\b/,
  },
];

export interface LeadScoreInput {
  type: LeadType;
  is_authenticated: boolean;
  has_phone: boolean;
  /** Mensaje del formulario + mensajes de texto del comprador en el chat. */
  buyer_texts: string[];
  buyer_chat_messages_count: number;
  /** Minutos que tardó el comprador en contestar al vendedor (mínimo observado). */
  fastest_buyer_reply_minutes: number | null;
  other_recent_leads_count: number;
  ai_hot: boolean;
}

export interface LeadScoreResult {
  score: number;
  tier: LeadTier;
  signals: LeadScoreSignal[];
}

export const normalizeLeadText = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const detectKeywordSignals = (texts: string[]): LeadScoreSignal[] => {
  const normalized = normalizeLeadText(texts.join(" \n "));
  return KEYWORD_SIGNALS.filter(({ pattern }) => pattern.test(normalized)).map(
    ({ signal }) => signal,
  );
};

export const resolveLeadTier = (score: number): LeadTier => {
  if (score >= LEAD_HOT_MIN_SCORE) {
    return LEAD_TIER.HOT;
  }
  if (score >= LEAD_WARM_MIN_SCORE) {
    return LEAD_TIER.WARM;
  }
  return LEAD_TIER.COLD;
};

export const computeLeadScore = (input: LeadScoreInput): LeadScoreResult => {
  const signals = new Set<LeadScoreSignal>(detectKeywordSignals(input.buyer_texts));

  if (input.type === LEAD_TYPE.CALL_ME) {
    signals.add(LEAD_SCORE_SIGNAL.CALL_REQUESTED);
  }
  if (input.is_authenticated) {
    signals.add(LEAD_SCORE_SIGNAL.VERIFIED_ACCOUNT);
  }
  if (input.has_phone) {
    signals.add(LEAD_SCORE_SIGNAL.PHONE_PROVIDED);
  }
  if (input.buyer_chat_messages_count >= LEAD_ENGAGED_CHAT_MIN_MESSAGES) {
    signals.add(LEAD_SCORE_SIGNAL.ENGAGED_CHAT);
  }
  if (
    input.fastest_buyer_reply_minutes !== null &&
    input.fastest_buyer_reply_minutes <= LEAD_FAST_RESPONSE_MAX_MINUTES
  ) {
    signals.add(LEAD_SCORE_SIGNAL.FAST_RESPONSE);
  }
  if (input.other_recent_leads_count > 0) {
    signals.add(LEAD_SCORE_SIGNAL.REPEAT_INTEREST);
  }
  if (input.ai_hot) {
    signals.add(LEAD_SCORE_SIGNAL.AI_HOT);
  }

  const longest_text = Math.max(
    0,
    ...input.buyer_texts.map((text) => text.trim().length),
  );
  if (longest_text >= LEAD_DETAILED_MESSAGE_MIN_LENGTH) {
    signals.add(LEAD_SCORE_SIGNAL.DETAILED_MESSAGE);
  }

  const has_intent_signal = [
    LEAD_SCORE_SIGNAL.CALL_REQUESTED,
    LEAD_SCORE_SIGNAL.APPOINTMENT,
    LEAD_SCORE_SIGNAL.FINANCING,
    LEAD_SCORE_SIGNAL.PURCHASE_INTENT,
    LEAD_SCORE_SIGNAL.TRADE_IN,
  ].some((signal) => signals.has(signal));
  if (
    !has_intent_signal &&
    input.type === LEAD_TYPE.CONTACT &&
    longest_text <= LEAD_LOW_DETAIL_MAX_LENGTH
  ) {
    signals.add(LEAD_SCORE_SIGNAL.LOW_DETAIL);
  }

  const ordered_signals = [...signals].sort(
    (a, b) => SIGNAL_POINTS[b] - SIGNAL_POINTS[a],
  );
  const raw_score = ordered_signals.reduce(
    (total, signal) => total + SIGNAL_POINTS[signal],
    BASE_SCORE,
  );
  const score = Math.max(0, Math.min(100, raw_score));

  return {
    score,
    tier: resolveLeadTier(score),
    signals: ordered_signals,
  };
};
