export const PROACTIVE_ALERT_GROUP = {
  PRICE_MARKET: "price_market",
  VISIBILITY: "visibility",
  LEADS: "leads",
  FEATURED: "featured",
  SUMMARY: "summary",
} as const;

export type ProactiveAlertGroup =
  (typeof PROACTIVE_ALERT_GROUP)[keyof typeof PROACTIVE_ALERT_GROUP];

export const PROACTIVE_ALERT_TYPE = {
  STALE_LOW_VIEWS: "stale_low_views",
  PRICE_ABOVE_MARKET: "price_above_market",
  MATCHING_BUYER_SEARCH: "matching_buyer_search",
  CHEAPER_COMPETITOR: "cheaper_competitor",
  HOT_LEAD_UNANSWERED: "hot_lead_unanswered",
  LEADS_PENDING_REPLY: "leads_pending_reply",
  VIEWS_NO_LEADS: "views_no_leads",
  VIEWS_DROP: "views_drop",
  LISTING_HEALTH_LOW: "listing_health_low",
  FEATURED_RECOMMENDED: "featured_recommended",
  FEATURED_EXPIRING: "featured_expiring",
  WEEKLY_SUMMARY: "weekly_summary",
} as const;

export type ProactiveAlertType =
  (typeof PROACTIVE_ALERT_TYPE)[keyof typeof PROACTIVE_ALERT_TYPE];

export interface ProactiveAlertCatalogItem {
  type: ProactiveAlertType;
  label: string;
  description: string;
  group: ProactiveAlertGroup;
  cooldown_days: number | null;
}

export const PROACTIVE_ALERT_TYPES: ProactiveAlertCatalogItem[] = [
  {
    type: PROACTIVE_ALERT_TYPE.STALE_LOW_VIEWS,
    label: "Anuncio con pocas visitas",
    description:
      "Te avisa si llevas muchos días publicado con visitas por debajo de tu segmento.",
    group: PROACTIVE_ALERT_GROUP.VISIBILITY,
    cooldown_days: 7,
  },
  {
    type: PROACTIVE_ALERT_TYPE.PRICE_ABOVE_MARKET,
    label: "Precio por encima del mercado",
    description: "Detecta cuando tu precio está alto respecto al mercado.",
    group: PROACTIVE_ALERT_GROUP.PRICE_MARKET,
    cooldown_days: 14,
  },
  {
    type: PROACTIVE_ALERT_TYPE.MATCHING_BUYER_SEARCH,
    label: "Comprador buscando tu modelo",
    description: "Cuando alguien guarda una búsqueda que encaja con tu vehículo.",
    group: PROACTIVE_ALERT_GROUP.LEADS,
    cooldown_days: 1,
  },
  {
    type: PROACTIVE_ALERT_TYPE.CHEAPER_COMPETITOR,
    label: "Competidor más barato",
    description: "Se publica un anuncio similar más económico.",
    group: PROACTIVE_ALERT_GROUP.PRICE_MARKET,
    cooldown_days: 3,
  },
  {
    type: PROACTIVE_ALERT_TYPE.HOT_LEAD_UNANSWERED,
    label: "Lead muy interesado sin respuesta",
    description: "Un contacto caliente lleva más de 2 horas sin respuesta tuya.",
    group: PROACTIVE_ALERT_GROUP.LEADS,
    cooldown_days: null,
  },
  {
    type: PROACTIVE_ALERT_TYPE.LEADS_PENDING_REPLY,
    label: "Contactos pendientes de respuesta",
    description: "Resumen diario de leads con más de 24 h sin contestar.",
    group: PROACTIVE_ALERT_GROUP.LEADS,
    cooldown_days: 1,
  },
  {
    type: PROACTIVE_ALERT_TYPE.VIEWS_NO_LEADS,
    label: "Visitas sin contactos",
    description: "Muchas visitas pero ningún lead en las últimas dos semanas.",
    group: PROACTIVE_ALERT_GROUP.VISIBILITY,
    cooldown_days: 14,
  },
  {
    type: PROACTIVE_ALERT_TYPE.VIEWS_DROP,
    label: "Caída de visitas",
    description: "Las visitas semanales bajan más de un 40 %.",
    group: PROACTIVE_ALERT_GROUP.VISIBILITY,
    cooldown_days: 7,
  },
  {
    type: PROACTIVE_ALERT_TYPE.LISTING_HEALTH_LOW,
    label: "Salud del anuncio baja",
    description: "Tu ficha tiene problemas que frenan las consultas.",
    group: PROACTIVE_ALERT_GROUP.VISIBILITY,
    cooldown_days: 14,
  },
  {
    type: PROACTIVE_ALERT_TYPE.FEATURED_RECOMMENDED,
    label: "Destacar recomendado",
    description: "El diagnóstico sugiere destacar el anuncio.",
    group: PROACTIVE_ALERT_GROUP.FEATURED,
    cooldown_days: 14,
  },
  {
    type: PROACTIVE_ALERT_TYPE.FEATURED_EXPIRING,
    label: "Destacado a punto de caducar",
    description: "Tu destacado termina en las próximas 24 horas.",
    group: PROACTIVE_ALERT_GROUP.FEATURED,
    cooldown_days: null,
  },
  {
    type: PROACTIVE_ALERT_TYPE.WEEKLY_SUMMARY,
    label: "Resumen semanal",
    description: "Visitas, contactos y leads calientes de la semana.",
    group: PROACTIVE_ALERT_GROUP.SUMMARY,
    cooldown_days: 7,
  },
];

export const proactiveAlertCategory = (type: ProactiveAlertType): string =>
  `proactive_${type}`;
