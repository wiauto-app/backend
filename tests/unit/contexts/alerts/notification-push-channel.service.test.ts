import { beforeEach, describe, expect, it, vi } from "vitest";

import { PushTokenType } from "@/src/contexts/profile_devices/entities/profile_devices.entity";
import { NotificationPushChannelService } from "@/src/contexts/alerts/services/notification-push-channel.service";
import type { NotifyInput } from "@/src/contexts/alerts/types/notify-input";
import type { PushConfig } from "@/src/contexts/alerts/types/push-config";

const chatInput = (overrides: Partial<NotifyInput> = {}): NotifyInput => ({
  profile_id: "user-1",
  category: "new_message",
  title: "Nuevo mensaje",
  body: "Hola",
  data: { chat_id: "chat-1", vehicle_id: "veh-1" },
  ...overrides,
});

const fcmDevice = (id: string, token = `fcm-token-${id}-abcdef`) => ({
  id,
  token,
  tokenType: PushTokenType.FCM,
});

const expoDevice = (id: string, token = `ExponentPushToken[${id}]`) => ({
  id,
  token,
  tokenType: PushTokenType.EXPO,
});

const buildService = (config: Partial<PushConfig> = {}) => {
  const push_config: PushConfig = {
    enabled: true,
    allowed_user_ids: [],
    dry_run: false,
    stale_device_days: 0,
    ...config,
  };
  const profile_devices_service = {
    findActiveByUserId: vi.fn().mockResolvedValue([]),
    markDelivered: vi.fn().mockResolvedValue(),
    deleteByToken: vi.fn().mockResolvedValue(),
  };
  const fcm_client = { send_each: vi.fn() };
  const expo_client = { send_each: vi.fn() };
  const badge_service = { compute_for_user: vi.fn().mockResolvedValue(4) };
  const maintenance_enqueue_service = {
    schedule_expo_receipts: vi.fn().mockResolvedValue(),
  };

  const service = new NotificationPushChannelService(
    push_config,
    profile_devices_service as never,
    fcm_client as never,
    expo_client as never,
    badge_service as never,
    maintenance_enqueue_service as never,
  );

  return {
    service,
    profile_devices_service,
    fcm_client,
    expo_client,
    badge_service,
    maintenance_enqueue_service,
  };
};

describe("NotificationPushChannelService.send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con el flag apagado no consulta dispositivos ni envía", async () => {
    const { service, profile_devices_service, fcm_client } = buildService({
      enabled: false,
    });

    await service.send(chatInput());

    expect(profile_devices_service.findActiveByUserId).not.toHaveBeenCalled();
    expect(fcm_client.send_each).not.toHaveBeenCalled();
  });

  it("respeta la allowlist de usuarios", async () => {
    const { service, profile_devices_service } = buildService({
      allowed_user_ids: ["otro-usuario"],
    });

    await service.send(chatInput());

    expect(profile_devices_service.findActiveByUserId).not.toHaveBeenCalled();
  });

  it("permite el envío si el usuario está en la allowlist", async () => {
    const { service, profile_devices_service, fcm_client } = buildService({
      allowed_user_ids: ["user-1"],
    });
    profile_devices_service.findActiveByUserId.mockResolvedValue([fcmDevice("d1")]);
    fcm_client.send_each.mockResolvedValue([{ ok: true, code: "ok" }]);

    await service.send(chatInput());

    expect(fcm_client.send_each).toHaveBeenCalledTimes(1);
  });

  it("en dry-run solo registra logs: no llama a FCM ni a Expo", async () => {
    const { service, profile_devices_service, fcm_client, expo_client } =
      buildService({ dry_run: true });
    profile_devices_service.findActiveByUserId.mockResolvedValue([
      fcmDevice("d1"),
      expoDevice("d2"),
    ]);

    await service.send(chatInput());

    expect(fcm_client.send_each).not.toHaveBeenCalled();
    expect(expo_client.send_each).not.toHaveBeenCalled();
    expect(profile_devices_service.markDelivered).not.toHaveBeenCalled();
  });

  it("no envía si la categoría no es un tipo de push", async () => {
    const { service, profile_devices_service } = buildService();

    await service.send(chatInput({ category: "reports" }));

    expect(profile_devices_service.findActiveByUserId).not.toHaveBeenCalled();
  });

  it("envía a todos los dispositivos del usuario, cada uno por su proveedor", async () => {
    const { service, profile_devices_service, fcm_client, expo_client } =
      buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([
      fcmDevice("d1"),
      fcmDevice("d2"),
      expoDevice("d3"),
    ]);
    fcm_client.send_each.mockResolvedValue([
      { ok: true, code: "ok" },
      { ok: true, code: "ok" },
    ]);
    expo_client.send_each.mockResolvedValue([
      { ok: true, code: "ok", ticket_id: "ticket-3" },
    ]);

    await service.send(chatInput(), { notification_id: "notif-1" });

    const fcm_targets = fcm_client.send_each.mock.calls[0][0] as {
      token: string;
      message: { data: Record<string, string> };
    }[];
    expect(fcm_targets).toHaveLength(2);
    expect(fcm_targets[0].message.data).toMatchObject({
      type: "new_message",
      user_id: "user-1",
      chat_id: "chat-1",
      notification_id: "notif-1",
    });
    expect(expo_client.send_each.mock.calls[0][0]).toHaveLength(1);
    expect(profile_devices_service.markDelivered).toHaveBeenCalledWith([
      "d1",
      "d2",
      "d3",
    ]);
  });

  it("agrega el badge solo al mensaje de Expo (iOS)", async () => {
    const { service, profile_devices_service, fcm_client, expo_client, badge_service } =
      buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([
      fcmDevice("d1"),
      expoDevice("d2"),
    ]);
    fcm_client.send_each.mockResolvedValue([{ ok: true, code: "ok" }]);
    expo_client.send_each.mockResolvedValue([
      { ok: true, code: "ok", ticket_id: "t" },
    ]);

    await service.send(chatInput());

    const [{ message: fcm_message }] = fcm_client.send_each.mock.calls[0][0] as {
      message: { badge?: number };
    }[];
    const [{ message: expo_message }] = expo_client.send_each.mock.calls[0][0] as {
      message: { badge?: number };
    }[];
    expect(badge_service.compute_for_user).toHaveBeenCalledWith("user-1");
    expect(fcm_message.badge).toBeUndefined();
    expect(expo_message.badge).toBe(4);
  });

  it("borra el token cuando FCM responde registration-token-not-registered", async () => {
    const { service, profile_devices_service, fcm_client } = buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([
      fcmDevice("d1", "token-muerto"),
      fcmDevice("d2", "token-vivo"),
    ]);
    fcm_client.send_each.mockResolvedValue([
      { ok: false, code: "messaging/registration-token-not-registered" },
      { ok: true, code: "ok" },
    ]);

    await service.send(chatInput());

    expect(profile_devices_service.deleteByToken).toHaveBeenCalledTimes(1);
    expect(profile_devices_service.deleteByToken).toHaveBeenCalledWith("token-muerto");
    expect(profile_devices_service.markDelivered).toHaveBeenCalledWith(["d2"]);
  });

  it("no borra el token por un fallo transitorio", async () => {
    const { service, profile_devices_service, fcm_client } = buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([fcmDevice("d1")]);
    fcm_client.send_each.mockResolvedValue([
      { ok: false, code: "messaging/server-unavailable" },
    ]);

    await service.send(chatInput());

    expect(profile_devices_service.deleteByToken).not.toHaveBeenCalled();
  });

  it("borra el token cuando Expo responde DeviceNotRegistered y agenda recibos de los ok", async () => {
    const {
      service,
      profile_devices_service,
      expo_client,
      maintenance_enqueue_service,
    } = buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([
      expoDevice("d1", "ExponentPushToken[muerto]"),
      expoDevice("d2", "ExponentPushToken[vivo]"),
    ]);
    expo_client.send_each.mockResolvedValue([
      { ok: false, code: "DeviceNotRegistered" },
      { ok: true, code: "ok", ticket_id: "ticket-2" },
    ]);

    await service.send(chatInput());

    expect(profile_devices_service.deleteByToken).toHaveBeenCalledWith(
      "ExponentPushToken[muerto]",
    );
    expect(maintenance_enqueue_service.schedule_expo_receipts).toHaveBeenCalledWith([
      { ticket_id: "ticket-2", token: "ExponentPushToken[vivo]" },
    ]);
  });

  it("nunca lanza: un error interno se traga y no afecta a los demás canales", async () => {
    const { service, profile_devices_service } = buildService();
    profile_devices_service.findActiveByUserId.mockRejectedValue(
      new Error("db caída"),
    );

    await expect(service.send(chatInput())).resolves.toBeUndefined();
  });

  it("nunca lanza aunque el proveedor reviente", async () => {
    const { service, profile_devices_service, fcm_client } = buildService();
    profile_devices_service.findActiveByUserId.mockResolvedValue([fcmDevice("d1")]);
    fcm_client.send_each.mockRejectedValue(new Error("boom"));

    await expect(service.send(chatInput())).resolves.toBeUndefined();
  });
});
