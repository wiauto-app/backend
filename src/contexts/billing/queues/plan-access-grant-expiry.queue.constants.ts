export const PLAN_ACCESS_GRANT_EXPIRY_QUEUE = "plan-access-grant-expiry";

/** Libera el plan del concesionario de los grants gratuitos vencidos. */
export const PLAN_ACCESS_GRANT_EXPIRY_JOB = "process_expired_grants";

/** Diario a las 03:00 (hora de Madrid). */
export const PLAN_ACCESS_GRANT_EXPIRY_CRON = "0 3 * * *";
export const PLAN_ACCESS_GRANT_EXPIRY_TZ = "Europe/Madrid";
