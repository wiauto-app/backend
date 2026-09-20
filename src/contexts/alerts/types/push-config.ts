export const PUSH_CONFIG = Symbol("PUSH_CONFIG");

export interface PushConfig {
  /** Interruptor maestro (`PUSH_NOTIFICATIONS_ENABLED`). */
  enabled: boolean;
  /** Si no está vacío, solo estos user ids reciben push. */
  allowed_user_ids: readonly string[];
  /** Solo registra en logs; no llama a FCM ni a Expo. */
  dry_run: boolean;
  /** Días sin señal de vida para borrar un dispositivo. 0 = desactivado. */
  stale_device_days: number;
}
