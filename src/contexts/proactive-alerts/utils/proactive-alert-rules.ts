import { PRICE_VERDICT, LISTING_HEALTH_TIER, FEATURED_RECOMMENDATION } from "@/src/contexts/vehicles/types/vehicle-insights";
import { LEAD_TIER } from "@/src/contexts/vehicles/types/lead-scoring";

import { PROACTIVE_ALERT_TYPE, type ProactiveAlertType } from "../constants/proactive-alert-types";

export interface ProactiveAlertPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface StaleLowViewsInput {
  days_published: number;
  daily_views: number;
  segment_daily_views: number;
  suggested_price_drop_eur: number;
  vehicle_id: string;
}

export const evaluateStaleLowViews = (
  input: StaleLowViewsInput,
): ProactiveAlertPayload | null => {
  if (input.days_published < 21) {
    return null;
  }
  if (input.daily_views >= input.segment_daily_views) {
    return null;
  }
  const drop = Math.max(0, Math.round(input.suggested_price_drop_eur));
  return {
    title: "Pocas visitas en tu anuncio",
    body: `Tu anuncio lleva ${input.days_published} días con pocas visitas; bajar ${drop} € te coloca en el 20 % más competitivo de tu segmento.`,
    data: {
      vehicle_id: input.vehicle_id,
      suggested_price_drop_eur: drop,
    },
  };
};

export interface PriceAboveMarketInput {
  verdict: string;
  suggested_price: number | null;
  vehicle_id: string;
}

export const evaluatePriceAboveMarket = (
  input: PriceAboveMarketInput,
): ProactiveAlertPayload | null => {
  if (
    input.verdict !== PRICE_VERDICT.ALTO &&
    input.verdict !== PRICE_VERDICT.MUY_ALTO
  ) {
    return null;
  }
  if (input.suggested_price == null) {
    return null;
  }
  return {
    title: "Precio por encima del mercado",
    body: `Tu precio está alto para el segmento. Valora situarlo en torno a ${Math.round(input.suggested_price)} €.`,
    data: {
      vehicle_id: input.vehicle_id,
      suggested_price: input.suggested_price,
    },
  };
};

export interface MatchingBuyerSearchInput {
  vehicle_id: string;
  vehicle_title: string;
}

export const evaluateMatchingBuyerSearch = (
  input: MatchingBuyerSearchInput,
): ProactiveAlertPayload => ({
  title: "Comprador buscando tu modelo",
  body: `Llegó un comprador buscando exactamente tu ${input.vehicle_title}.`,
  data: { vehicle_id: input.vehicle_id },
});

export interface CheaperCompetitorInput {
  vehicle_id: string;
  competitor_price: number;
  your_price: number;
}

export const evaluateCheaperCompetitor = (
  input: CheaperCompetitorInput,
): ProactiveAlertPayload | null => {
  if (input.competitor_price >= input.your_price) {
    return null;
  }
  return {
    title: "Anuncio similar más barato",
    body: `Se ha publicado un ${Math.round(input.competitor_price)} € frente a tus ${Math.round(input.your_price)} €.`,
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface HotLeadUnansweredInput {
  lead_id: string;
  lead_name: string;
  vehicle_id: string;
  hours_unanswered: number;
}

export const evaluateHotLeadUnanswered = (
  input: HotLeadUnansweredInput,
): ProactiveAlertPayload | null => {
  if (input.hours_unanswered < 2) {
    return null;
  }
  return {
    title: "Lead muy interesado sin respuesta",
    body: `${input.lead_name} lleva más de 2 horas esperando tu respuesta.`,
    data: {
      lead_id: input.lead_id,
      vehicle_id: input.vehicle_id,
    },
  };
};

export interface LeadsPendingReplyInput {
  pending_count: number;
}

export const evaluateLeadsPendingReply = (
  input: LeadsPendingReplyInput,
): ProactiveAlertPayload | null => {
  if (input.pending_count <= 0) {
    return null;
  }
  return {
    title: "Contactos pendientes de respuesta",
    body: `Tienes ${input.pending_count} contacto(s) con más de 24 h sin respuesta.`,
    data: { pending_count: input.pending_count },
  };
};

export interface ViewsNoLeadsInput {
  vehicle_id: string;
  views_trend: string;
  leads_count_14d: number;
}

export const evaluateViewsNoLeads = (
  input: ViewsNoLeadsInput,
): ProactiveAlertPayload | null => {
  if (input.leads_count_14d > 0) {
    return null;
  }
  if (input.views_trend === "below") {
    return null;
  }
  return {
    title: "Visitas sin contactos",
    body: "Tu anuncio recibe visitas pero no genera consultas. Revisa precio y fotos.",
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface ViewsDropInput {
  vehicle_id: string;
  drop_percent: number;
}

export const evaluateViewsDrop = (
  input: ViewsDropInput,
): ProactiveAlertPayload | null => {
  if (input.drop_percent < 40) {
    return null;
  }
  return {
    title: "Caída de visitas",
    body: `Las visitas semanales han bajado un ${Math.round(input.drop_percent)} % respecto a la semana anterior.`,
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface ListingHealthLowInput {
  vehicle_id: string;
  health_tier: string;
  primary_issue: string;
  cta: string;
}

export const evaluateListingHealthLow = (
  input: ListingHealthLowInput,
): ProactiveAlertPayload | null => {
  if (input.health_tier !== LISTING_HEALTH_TIER.LOW) {
    return null;
  }
  return {
    title: "Mejora la salud de tu anuncio",
    body: `${input.primary_issue}. ${input.cta}`,
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface FeaturedRecommendedInput {
  vehicle_id: string;
  recommendation: string;
  can_feature: boolean;
}

export const evaluateFeaturedRecommended = (
  input: FeaturedRecommendedInput,
): ProactiveAlertPayload | null => {
  if (
    input.recommendation !== FEATURED_RECOMMENDATION.RECOMMENDED ||
    !input.can_feature
  ) {
    return null;
  }
  return {
    title: "Destaca tu anuncio",
    body: "El diagnóstico recomienda destacar este vehículo para ganar visibilidad.",
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface FeaturedExpiringInput {
  vehicle_id: string;
  hours_left: number;
}

export const evaluateFeaturedExpiring = (
  input: FeaturedExpiringInput,
): ProactiveAlertPayload | null => {
  if (input.hours_left > 24 || input.hours_left < 0) {
    return null;
  }
  return {
    title: "Tu destacado caduca pronto",
    body: "El periodo destacado termina en menos de 24 horas.",
    data: { vehicle_id: input.vehicle_id },
  };
};

export interface WeeklySummaryInput {
  views: number;
  leads: number;
  hot_leads: number;
}

export const evaluateWeeklySummary = (
  input: WeeklySummaryInput,
): ProactiveAlertPayload => ({
  title: "Resumen semanal de tus anuncios",
  body: `Esta semana: ${input.views} visitas, ${input.leads} contactos y ${input.hot_leads} muy interesados.`,
  data: {
    views: input.views,
    leads: input.leads,
    hot_leads: input.hot_leads,
  },
});

export const isHotLeadTier = (tier: string): boolean => tier === LEAD_TIER.HOT;

export const proactiveRuleByType = (
  type: ProactiveAlertType,
): string => type;
