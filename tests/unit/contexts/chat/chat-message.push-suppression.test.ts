import { beforeEach, describe, expect, it, vi } from "vitest";

// El repositorio de vehículos resuelve relaciones con `require` en tiempo de carga, algo que
// no funciona bajo vitest; aquí solo hace falta el token de inyección.
vi.mock("@/src/contexts/vehicles/repositories/typeorm.vehicle-repository", () => ({
  TypeOrmVehicleRepository: vi.fn(),
}));

import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { CHAT_TYPE, Chat } from "@/src/contexts/chat/types/chat";

const buildService = (users_in_room: string[]) => {
  const vehicle_repository = {
    findOne: vi.fn().mockResolvedValue({
      profile_id: "seller-1",
      publisher_type: "particular",
    }),
  };
  const profile_repository = {
    findOne: vi.fn().mockResolvedValue({ name: "Ana", last_name: "Pérez" }),
  };
  const alert_processing_enqueue_service = {
    enqueue_vehicle_event: vi.fn().mockResolvedValue(),
  };
  const notification_channel_dispatcher = {
    notify: vi.fn().mockResolvedValue(),
  };
  const chat_message_gateway = {
    isUserInChatRoom: vi.fn(
      (_chat_id: string, user_id: string) =>
        Promise.resolve(users_in_room.includes(user_id)),
    ),
  };
  const user_repository = {
    find: vi.fn().mockResolvedValue([{ id: "admin-1" }]),
  };

  const service = new ChatMessageService(
    {} as never,
    {} as never,
    {} as never,
    vehicle_repository as never,
    profile_repository as never,
    alert_processing_enqueue_service as never,
    notification_channel_dispatcher as never,
    {} as never,
    chat_message_gateway as never,
    user_repository as never,
  );

  const enqueue = (chat: Chat, sender_id: string, content: string) =>
    (
      service as unknown as {
        enqueueMessageAlerts: (c: Chat, s: string, t: string) => Promise<void>;
      }
    ).enqueueMessageAlerts(chat, sender_id, content);

  return {
    enqueue,
    chat_message_gateway,
    alert_processing_enqueue_service,
    notification_channel_dispatcher,
  };
};

const vehicleChat = () =>
  Chat.create({
    participants: ["buyer-1", "seller-1"],
    chat_type: CHAT_TYPE.PRIVATE,
    vehicle_id: "veh-1",
  });

const supportChat = () =>
  Chat.create({
    participants: ["user-1"],
    chat_type: CHAT_TYPE.SUPPORT,
    vehicle_id: null,
    ticket_id: "ticket-1",
  });

describe("ChatMessageService: supresión de push si el chat está abierto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("excluye el canal push cuando el destinatario está en la sala del chat", async () => {
    const { enqueue, alert_processing_enqueue_service } = buildService(["seller-1"]);
    const chat = vehicleChat();

    await enqueue(chat, "buyer-1", "Hola");

    expect(alert_processing_enqueue_service.enqueue_vehicle_event).toHaveBeenCalledTimes(1);
    expect(alert_processing_enqueue_service.enqueue_vehicle_event).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "new_message",
        profile_id: "seller-1",
        exclude_channels: ["push"],
      }),
    );
  });

  it("no excluye nada cuando el destinatario no tiene el chat abierto", async () => {
    const { enqueue, alert_processing_enqueue_service } = buildService([]);

    await enqueue(vehicleChat(), "buyer-1", "Hola");

    expect(alert_processing_enqueue_service.enqueue_vehicle_event).toHaveBeenCalledWith(
      expect.objectContaining({ exclude_channels: undefined }),
    );
  });

  it("no incluye chat_id ni exclude_channels dentro de metadata", async () => {
    const { enqueue, alert_processing_enqueue_service } = buildService(["seller-1"]);
    const chat = vehicleChat();

    await enqueue(chat, "buyer-1", "Hola");

    const [call] = alert_processing_enqueue_service.enqueue_vehicle_event.mock
      .calls[0] as [{ metadata: Record<string, unknown> }];
    expect(call.metadata).not.toHaveProperty("exclude_channels");
    expect(call.metadata.chat_id).toBe(chat.id);
  });

  it("soporte: marca push_type support_message y excluye push solo a quien tiene el chat abierto", async () => {
    const { enqueue, notification_channel_dispatcher } = buildService(["admin-1"]);

    await enqueue(supportChat(), "sender-x", "Necesito ayuda");

    const calls = notification_channel_dispatcher.notify.mock.calls.map(
      ([input]) => input as Record<string, unknown>,
    );
    expect(calls).toHaveLength(2);
    for (const input of calls) {
      expect(input.push_type).toBe("support_message");
      expect(input.category).toBe("new_message");
    }
    const admin = calls.find((c) => c.profile_id === "admin-1");
    const user = calls.find((c) => c.profile_id === "user-1");
    expect(admin?.exclude_channels).toEqual(["push"]);
    expect(user?.exclude_channels).toBeUndefined();
  });
});
