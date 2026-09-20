import { describe, expect, it } from "vitest";

import {
  build_push_message,
  resolve_push_type,
  to_data_string,
} from "@/src/contexts/alerts/services/push-message.builder";
import type { NotifyInput } from "@/src/contexts/alerts/types/notify-input";

const NOW = new Date("2026-01-02T03:04:05.000Z");

const chatInput = (overrides: Partial<NotifyInput> = {}): NotifyInput => ({
  profile_id: "user-1",
  category: "new_message",
  title: "Nuevo mensaje de Ana",
  body: "Hola, ¿sigue disponible?",
  data: {
    event_type: "new_message",
    profile_id: "user-1",
    alert_id: null,
    chat_id: "chat-1",
    vehicle_id: "veh-1",
    sender_name: "Ana",
    message_excerpt: "Hola, ¿sigue disponible?",
    vehicle_price: 12_500,
    previous_price: undefined,
  },
  ...overrides,
});

const buildMessage = (
  input: NotifyInput,
  options: Parameters<typeof build_push_message>[1] = {},
) => {
  const message = build_push_message(input, options);
  if (!message) {
    throw new Error("Se esperaba un mensaje push");
  }
  return message;
};

describe("resolve_push_type", () => {
  it("usa la categoría cuando es un tipo conocido", () => {
    expect(resolve_push_type(chatInput({ category: "price_drop" }))).toBe(
      "price_drop",
    );
  });

  it("push_type explícito gana sobre la categoría", () => {
    expect(resolve_push_type(chatInput({ push_type: "support_message" }))).toBe(
      "support_message",
    );
  });

  it("una categoría desconocida no genera push", () => {
    expect(resolve_push_type(chatInput({ category: "reports" }))).toBeNull();
  });
});

describe("to_data_string", () => {
  it("convierte números y recorta strings; descarta null, vacíos y objetos", () => {
    expect(to_data_string(42)).toBe("42");
    expect(to_data_string("  abc  ")).toBe("abc");
    expect(to_data_string("   ")).toBeNull();
    expect(to_data_string(null)).toBeNull();
    const missing: unknown = undefined;
    expect(to_data_string(missing)).toBeNull();
    expect(to_data_string({ a: 1 })).toBeNull();
    expect(to_data_string(Number.NaN)).toBeNull();
  });
});

describe("build_push_message", () => {
  it("arma el payload push-payload-v1 con whitelist y solo strings", () => {
    const message = buildMessage(chatInput(), {
      now: NOW,
      notification_id: "notif-1",
    });

    expect(message.data).toEqual({
      type: "new_message",
      v: "1",
      user_id: "user-1",
      sent_at: NOW.toISOString(),
      chat_id: "chat-1",
      vehicle_id: "veh-1",
      notification_id: "notif-1",
    });
    for (const value of Object.values(message.data)) {
      expect(typeof value).toBe("string");
    }
  });

  it("nunca vuelca el payload completo (sender_name, precios, alert_id nulo)", () => {
    const { data } = buildMessage(chatInput(), { now: NOW });

    expect(data).not.toHaveProperty("sender_name");
    expect(data).not.toHaveProperty("message_excerpt");
    expect(data).not.toHaveProperty("vehicle_price");
    expect(data).not.toHaveProperty("alert_id");
    expect(data).not.toHaveProperty("event_type");
  });

  it("los pushes de chat usan canal messages, prioridad alta, ttl de 1 día y thread por chat", () => {
    const message = buildMessage(chatInput(), { now: NOW });

    expect(message.channel_id).toBe("messages");
    expect(message.priority).toBe("high");
    expect(message.ttl_seconds).toBe(86_400);
    expect(message.thread_key).toBe("chat:chat-1");
    expect(message.image_url).toBeUndefined();
  });

  it("los pushes de anuncios usan canal alerts, ttl de 3 días, alert_id e imagen", () => {
    const message = build_push_message(
      chatInput({
        category: "price_drop",
        data: {
          alert_id: "alert-1",
          vehicle_id: "veh-9",
          chat_id: "ignorado",
          vehicle_image_url: "https://media.wiauto.es/v.jpg",
        },
      }),
      { now: NOW },
    );

    expect(message.channel_id).toBe("alerts");
    expect(message.priority).toBe("normal");
    expect(message.ttl_seconds).toBe(259_200);
    expect(message.thread_key).toBeUndefined();
    expect(message.image_url).toBe("https://media.wiauto.es/v.jpg");
    expect(message.data).toMatchObject({ alert_id: "alert-1", vehicle_id: "veh-9" });
    expect(message.data).not.toHaveProperty("chat_id");
  });

  it("descarta imágenes que no son http(s)", () => {
    const message = buildMessage(
      chatInput({
        category: "new_listing",
        data: { vehicle_image_url: "javascript:alert(1)" },
      }),
      { now: NOW },
    );

    expect(message.image_url).toBeUndefined();
  });

  it("los mensajes de soporte llevan ticket_id", () => {
    const message = buildMessage(
      chatInput({
        push_type: "support_message",
        data: { chat_id: "chat-2", ticket_id: "ticket-7" },
      }),
      { now: NOW },
    );

    expect(message.type).toBe("support_message");
    expect(message.data).toMatchObject({ chat_id: "chat-2", ticket_id: "ticket-7" });
  });

  it("no genera push sin destinatario ni para categorías desconocidas", () => {
    expect(build_push_message(chatInput({ profile_id: null }))).toBeNull();
    expect(build_push_message(chatInput({ category: "otra" }))).toBeNull();
  });

  it("trunca título y cuerpo", () => {
    const message = buildMessage(
      chatInput({ title: "t".repeat(300), body: "b".repeat(1000) }),
      { now: NOW },
    );

    expect(message.title.length).toBeLessThanOrEqual(100);
    expect(message.body.length).toBeLessThanOrEqual(240);
  });

  it("si el data se infla, conserva solo lo esencial", () => {
    const message = buildMessage(
      chatInput({ data: { chat_id: "c".repeat(5000) } }),
      { now: NOW },
    );

    expect(Object.keys(message.data).sort()).toEqual(
      ["sent_at", "type", "user_id", "v"].sort(),
    );
  });
});
