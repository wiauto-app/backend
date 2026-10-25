/**
 * Nombres de los throttlers registrados en `ThrottlerModule.forRoot` (AppModule).
 * Fuente única para `@SkipThrottle`/`@Throttle`: un nombre que no esté aquí
 * no se puede omitir de forma segura en los controladores opt-in.
 */
export const THROTTLER_NAME = {
  VEHICLE_AI: "vehicle-ai",
  AI_SEARCH_FILTERS: "ai-search-filters",
  SUPPORT_TICKETS: "support-tickets",
  VEHICLE_IDENTIFICATION: "vehicle-identification",
  GUEST_TEMP_UPLOAD: "guest-temp-upload",
  GUEST_PUBLISH_AI: "guest-publish-ai",
  GUEST_PUBLISH_LOOKUP: "guest-publish-lookup",
  PUBLIC_LEADS: "public-leads",
  NEWSLETTER_SUBSCRIBE: "newsletter-subscribe",
} as const;

export type ThrottlerName = (typeof THROTTLER_NAME)[keyof typeof THROTTLER_NAME];

export const ALL_THROTTLER_NAMES: readonly ThrottlerName[] =
  Object.values(THROTTLER_NAME);
