import { beforeEach, describe, expect, it, vi } from "vitest";

const { send_each_mock } = vi.hoisted(() => ({ send_each_mock: vi.fn() }));

vi.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({ sendEach: send_each_mock }),
}));

import {
  FcmPushClient,
  is_invalid_fcm_token_error,
  is_transient_fcm_error,
  to_fcm_message,
} from "@/src/contexts/alerts/clients/fcm-push.client";
import type { PushMessage } from "@/src/contexts/alerts/types/push-message";

const message: PushMessage = {
  user_id: "user-1",
  type: "new_message",
  title: "Hola",
  body: "Mundo",
  data: {
    type: "new_message",
    v: "1",
    user_id: "user-1",
    sent_at: "2026-01-02T03:04:05.000Z",
    chat_id: "chat-1",
  },
  channel_id: "messages",
  priority: "high",
  ttl_seconds: 86_400,
  thread_key: "chat:chat-1",
};

const ok = { success: true, messageId: "m-1" };
const failure = (code: string, error_message = "") => ({
  success: false,
  error: { code, message: error_message },
});

describe("to_fcm_message", () => {
  it("arma el mensaje Android con canal, prioridad, ttl y tag", () => {
    const fcm = to_fcm_message("token-1", message);

    expect(fcm).toMatchObject({
      token: "token-1",
      notification: { title: "Hola", body: "Mundo" },
      data: message.data,
      android: {
        priority: "high",
        ttl: 86_400_000,
        notification: { channelId: "messages", tag: "chat:chat-1" },
      },
    });
  });

  it("agrega imageUrl solo cuando hay imagen", () => {
    const con_imagen = to_fcm_message("t", {
      ...message,
      image_url: "https://media.wiauto.es/v.jpg",
    });
    const sin_imagen = to_fcm_message("t", message);

    expect(con_imagen.notification).toMatchObject({
      imageUrl: "https://media.wiauto.es/v.jpg",
    });
    expect(sin_imagen.notification).not.toHaveProperty("imageUrl");
  });
});

describe("clasificación de errores FCM", () => {
  it("identifica fallos transitorios", () => {
    expect(is_transient_fcm_error("messaging/server-unavailable")).toBe(true);
    expect(is_transient_fcm_error("messaging/internal-error")).toBe(true);
    expect(is_transient_fcm_error("messaging/quota-exceeded")).toBe(true);
    expect(is_transient_fcm_error("messaging/registration-token-not-registered")).toBe(
      false,
    );
  });

  it("identifica tokens inválidos", () => {
    expect(
      is_invalid_fcm_token_error("messaging/registration-token-not-registered"),
    ).toBe(true);
    expect(is_invalid_fcm_token_error("messaging/invalid-registration-token")).toBe(
      true,
    );
  });

  it("invalid-argument solo invalida el token si el mensaje lo menciona", () => {
    expect(
      is_invalid_fcm_token_error(
        "messaging/invalid-argument",
        "The registration token is not a valid FCM registration token",
      ),
    ).toBe(true);
    expect(
      is_invalid_fcm_token_error(
        "messaging/invalid-argument",
        "Invalid JSON payload received",
      ),
    ).toBe(false);
  });
});

const buildClient = () => {
  const client = new FcmPushClient();
  client.retry_delays_ms = [0, 0];
  return client;
};

describe("FcmPushClient.send_each", () => {
  beforeEach(() => {
    send_each_mock.mockReset();
  });

  it("reintenta solo los fallos transitorios y conserva el orden", async () => {
    send_each_mock
      .mockResolvedValueOnce({
        responses: [failure("messaging/server-unavailable"), ok],
      })
      .mockResolvedValueOnce({ responses: [ok] });

    const outcomes = await buildClient().send_each([
      { token: "a", message },
      { token: "b", message },
    ]);

    expect(send_each_mock).toHaveBeenCalledTimes(2);
    expect(send_each_mock.mock.calls[1][0]).toHaveLength(1);
    expect(outcomes.map((o) => o.ok)).toEqual([true, true]);
  });

  it("hace como máximo 2 reintentos", async () => {
    send_each_mock.mockResolvedValue({
      responses: [failure("messaging/internal-error")],
    });

    const outcomes = await buildClient().send_each([{ token: "a", message }]);

    expect(send_each_mock).toHaveBeenCalledTimes(3);
    expect(outcomes[0]).toMatchObject({
      ok: false,
      code: "messaging/internal-error",
    });
  });

  it("no reintenta un token desregistrado", async () => {
    send_each_mock.mockResolvedValue({
      responses: [failure("messaging/registration-token-not-registered")],
    });

    const outcomes = await buildClient().send_each([{ token: "a", message }]);

    expect(send_each_mock).toHaveBeenCalledTimes(1);
    expect(outcomes[0].code).toBe("messaging/registration-token-not-registered");
  });

  it("nunca lanza si el SDK revienta: devuelve el código como fallo", async () => {
    send_each_mock.mockRejectedValue(
      Object.assign(new Error("caído"), { code: "messaging/server-unavailable" }),
    );

    const outcomes = await buildClient().send_each([{ token: "a", message }]);

    expect(outcomes[0]).toMatchObject({
      ok: false,
      code: "messaging/server-unavailable",
    });
  });
});
