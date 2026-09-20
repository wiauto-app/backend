export const PUSH_MAINTENANCE_QUEUE = "push-maintenance";

/** Consulta diferida de recibos de Expo (los tickets solo confirman la recepción). */
export const PUSH_JOB_EXPO_RECEIPTS = "expo_receipts";
/** Limpieza periódica de dispositivos sin señal de vida. */
export const PUSH_JOB_STALE_DEVICES = "stale_devices_cleanup";

/** Expo recomienda esperar ~15 min antes de pedir los recibos. */
export const PUSH_EXPO_RECEIPTS_DELAY_MS = 15 * 60 * 1000;

export interface PushExpoReceiptsJobData {
  items: { ticket_id: string; token: string }[];
}
