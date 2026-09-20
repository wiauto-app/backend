import { Injectable } from "@nestjs/common";
import { getMessaging, type Message } from "firebase-admin/messaging";

import type { PushMessage } from "../types/push-message";

export interface FcmSendOutcome {
  ok: boolean;
  message_id?: string;
  /** `ok` o el código de firebase-admin (p. ej. `messaging/server-unavailable`). */
  code: string;
  /** Mensaje del error; solo se usa para clasificar `invalid-argument`. */
  error_message?: string;
}

const TRANSIENT_CODES = new Set([
  "messaging/server-unavailable",
  "messaging/internal-error",
  "messaging/quota-exceeded",
]);

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export const is_transient_fcm_error = (code: string): boolean =>
  TRANSIENT_CODES.has(code);

/**
 * El token ya no sirve: se borra el dispositivo. `invalid-argument` solo cuenta si el
 * mensaje de error apunta al token (si no, el problema es el payload y no hay que borrar).
 */
export const is_invalid_fcm_token_error = (
  code: string,
  error_message?: string,
): boolean => {
  if (INVALID_TOKEN_CODES.has(code)) {
    return true;
  }
  return (
    code === "messaging/invalid-argument" &&
    /registration token/i.test(error_message ?? "")
  );
};

export const to_fcm_message = (token: string, message: PushMessage): Message => {
  const { thread_key, image_url } = message;

  return {
    token,
    notification: {
      title: message.title,
      body: message.body,
      ...(image_url ? { imageUrl: image_url } : {}),
    },
    data: { ...message.data } as unknown as Record<string, string>,
    android: {
      priority: message.priority,
      ttl: message.ttl_seconds * 1000,
      notification: {
        channelId: message.channel_id,
        sound: "default",
        ...(thread_key ? { tag: thread_key } : {}),
        ...(image_url ? { imageUrl: image_url } : {}),
      },
    },
    apns: {
      headers: {
        "apns-priority": message.priority === "high" ? "10" : "5",
        ...(thread_key ? { "apns-collapse-id": thread_key } : {}),
      },
      payload: {
        aps: {
          sound: "default",
          ...(thread_key ? { "thread-id": thread_key } : {}),
        },
      },
    },
  };
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class FcmPushClient {
  /** Espera antes de cada reintento (2 reintentos como máximo). */
  retry_delays_ms: number[] = [500, 1500];

  /**
   * Envía un mensaje por token con `sendEach`. Solo los fallos transitorios se reintentan.
   * Nunca lanza: los errores del SDK se devuelven como `FcmSendOutcome`.
   */
  async send_each(
    targets: { token: string; message: PushMessage }[],
  ): Promise<FcmSendOutcome[]> {
    const outcomes: FcmSendOutcome[] = targets.map(() => ({
      ok: false,
      code: "not-sent",
    }));
    let pending = targets.map((_, index) => index);

    for (let attempt = 0; pending.length > 0; attempt += 1) {
      const batch = pending.map((index) =>
        to_fcm_message(targets[index].token, targets[index].message),
      );

      let responses: {
        success: boolean;
        messageId?: string;
        error?: { code: string; message: string };
      }[];
      try {
        const batch_response = await getMessaging().sendEach(batch);
        responses = batch_response.responses;
      } catch (error) {
        const code = this.extract_code(error);
        responses = batch.map(() => ({
          success: false,
          error: { code, message: error instanceof Error ? error.message : "" },
        }));
      }

      const retry: number[] = [];
      for (const [position, response] of responses.entries()) {
        const index = pending[position];
        if (response.success) {
          outcomes[index] = { ok: true, message_id: response.messageId, code: "ok" };
          continue;
        }
        const code = response.error?.code ?? "messaging/unknown-error";
        outcomes[index] = {
          ok: false,
          code,
          error_message: response.error?.message,
        };
        if (is_transient_fcm_error(code)) {
          retry.push(index);
        }
      }

      if (retry.length === 0 || attempt >= this.retry_delays_ms.length) {
        break;
      }
      pending = retry;
      await sleep(this.retry_delays_ms[attempt]);
    }

    return outcomes;
  }

  private extract_code(error: unknown): string {
    if (typeof error === "object" && error && "code" in error) {
      const code = (error as { code: unknown }).code;
      if (typeof code === "string") {
        return code;
      }
    }
    return "messaging/unknown-error";
  }
}
