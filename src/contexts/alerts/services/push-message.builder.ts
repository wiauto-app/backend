import type { NotifyInput } from "../types/notify-input";
import {
  PUSH_DATA_MAX_BYTES,
  PUSH_PAYLOAD_VERSION,
  PUSH_TYPE,
  type PushChannelId,
  type PushDataV1,
  type PushMessage,
  type PushType,
} from "../types/push-message";

const TITLE_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 240;

const ONE_DAY_SECONDS = 24 * 60 * 60;
const THREE_DAYS_SECONDS = 3 * ONE_DAY_SECONDS;

const CHAT_TYPES = new Set<PushType>([
  PUSH_TYPE.NEW_MESSAGE,
  PUSH_TYPE.SELLER_REPLY,
  PUSH_TYPE.SUPPORT_MESSAGE,
]);

const LISTING_TYPES = new Set<PushType>([
  PUSH_TYPE.NEW_LISTING,
  PUSH_TYPE.PRICE_DROP,
  PUSH_TYPE.SOLD_REMOVED,
  PUSH_TYPE.FEATURED,
  PUSH_TYPE.RECENTLY_UPDATED,
  PUSH_TYPE.FAVORITE_CHANGE,
  PUSH_TYPE.SELLER_INSIGHT,
]);

const ALL_PUSH_TYPES = new Set<string>(Object.values(PUSH_TYPE));

/** Categoría de `NotifyInput` -> tipo de push. `null` = esa categoría no genera push. */
export const resolve_push_type = (input: NotifyInput): PushType | null => {
  if (input.push_type) {
    return input.push_type;
  }
  return ALL_PUSH_TYPES.has(input.category) ? (input.category as PushType) : null;
};

/** Solo strings/números no vacíos; `null`, objetos y vacíos se omiten (FCM exige strings). */
export const to_data_string = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const truncate = (text: string, max_length: number): string => {
  const trimmed = text.trim();
  return trimmed.length > max_length
    ? `${trimmed.slice(0, max_length - 1)}…`
    : trimmed;
};

/** Ids que aplican a cada familia de push (whitelist; nunca se vuelca el payload completo). */
const applicable_id_keys = (type: PushType): readonly string[] => {
  if (CHAT_TYPES.has(type)) {
    return ["chat_id", "ticket_id", "vehicle_id"];
  }
  if (LISTING_TYPES.has(type)) {
    return ["vehicle_id", "alert_id"];
  }
  return [];
};

const resolve_ttl_seconds = (type: PushType): number =>
  LISTING_TYPES.has(type) ? THREE_DAYS_SECONDS : ONE_DAY_SECONDS;

const resolve_image_url = (
  type: PushType,
  data: Record<string, unknown>,
): string | undefined => {
  if (!LISTING_TYPES.has(type)) {
    return undefined;
  }
  const url = to_data_string(data.vehicle_image_url);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
};

/**
 * Construye el mensaje `push-payload-v1`. Devuelve `null` si no hay destinatario o si la
 * categoría no es un tipo de push conocido.
 */
export const build_push_message = (
  input: NotifyInput,
  options: { now?: Date; notification_id?: string | null } = {},
): PushMessage | null => {
  if (!input.profile_id) {
    return null;
  }

  const type = resolve_push_type(input);
  if (!type) {
    return null;
  }

  const source = input.data ?? {};
  const data: PushDataV1 = {
    type,
    v: PUSH_PAYLOAD_VERSION,
    user_id: input.profile_id,
    sent_at: (options.now ?? new Date()).toISOString(),
  };

  for (const key of applicable_id_keys(type)) {
    const value = to_data_string(source[key]);
    if (value) {
      (data as unknown as Record<string, string>)[key] = value;
    }
  }

  const notification_id = to_data_string(options.notification_id);
  if (notification_id) {
    data.notification_id = notification_id;
  }

  // Cinturón de seguridad: si algo inesperado inflara el payload, se conserva lo esencial.
  const size = Buffer.byteLength(JSON.stringify(data), "utf8");
  const safe_data: PushDataV1 =
    size > PUSH_DATA_MAX_BYTES
      ? {
          type: data.type,
          v: data.v,
          user_id: data.user_id,
          sent_at: data.sent_at,
        }
      : data;

  const is_chat = CHAT_TYPES.has(type);
  const channel_id: PushChannelId = is_chat ? "messages" : "alerts";

  return {
    user_id: input.profile_id,
    type,
    title: truncate(input.title, TITLE_MAX_LENGTH),
    body: truncate(input.body, BODY_MAX_LENGTH),
    data: safe_data,
    channel_id,
    priority: is_chat ? "high" : "normal",
    ttl_seconds: resolve_ttl_seconds(type),
    thread_key: is_chat && safe_data.chat_id ? `chat:${safe_data.chat_id}` : undefined,
    image_url: resolve_image_url(type, source),
  };
};
