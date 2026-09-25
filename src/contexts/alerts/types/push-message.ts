/** Versión del contrato de `data` que consume la app móvil (`push-payload-v1`). */
export const PUSH_PAYLOAD_VERSION = "1";

/** Tope conservador del `data` (FCM admite 4 KB en total con el resto del mensaje). */
export const PUSH_DATA_MAX_BYTES = 3500;

export const PUSH_TYPE = {
  NEW_MESSAGE: "new_message",
  SELLER_REPLY: "seller_reply",
  SUPPORT_MESSAGE: "support_message",
  NEW_LISTING: "new_listing",
  PRICE_DROP: "price_drop",
  SOLD_REMOVED: "sold_removed",
  FEATURED: "featured",
  RECENTLY_UPDATED: "recently_updated",
  FAVORITE_CHANGE: "favorite_change",
  LEAD: "lead",
  SELLER_INSIGHT: "seller_insight",
} as const;

export type PushType = (typeof PUSH_TYPE)[keyof typeof PUSH_TYPE];

/** Canales de Android. `default` es el fallback cuando el cliente no crea el canal. */
export type PushChannelId = "messages" | "alerts";

/**
 * `data` del push: semántica (tipo + ids), nunca rutas. Todos los valores son strings.
 */
export interface PushDataV1 {
  type: PushType;
  v: typeof PUSH_PAYLOAD_VERSION;
  user_id: string;
  sent_at: string;
  chat_id?: string;
  vehicle_id?: string;
  alert_id?: string;
  ticket_id?: string;
  notification_id?: string;
}

/** Mensaje agnóstico del proveedor. Cada sender lo traduce a FCM o Expo. */
export interface PushMessage {
  user_id: string;
  type: PushType;
  title: string;
  body: string;
  data: PushDataV1;
  channel_id: PushChannelId;
  priority: "high" | "normal";
  ttl_seconds: number;
  /** Agrupa/reemplaza notificaciones del mismo hilo (`chat:<id>`). */
  thread_key?: string;
  image_url?: string;
  /** Solo iOS (Expo). Se completa justo antes de enviar. */
  badge?: number;
}

export type PushDeliveryStatus = "sent" | "invalid_token" | "failed";

export interface PushDeliveryResult {
  device_id: string;
  token: string;
  token_type: "fcm" | "expo";
  status: PushDeliveryStatus;
  /** Código de error del proveedor; `ok` cuando se aceptó. */
  code: string;
  /** Id de ticket Expo para consultar el recibo más tarde. */
  expo_ticket_id?: string;
}
