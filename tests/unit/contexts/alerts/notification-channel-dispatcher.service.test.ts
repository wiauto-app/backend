import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import type { NotifyInput } from "@/src/contexts/alerts/types/notify-input";
import { AlertNotificationPreferences } from "@/src/contexts/alerts/types/alert-notification-preferences";

const input = (overrides: Partial<NotifyInput> = {}): NotifyInput => ({
  profile_id: "user-1",
  category: "new_message",
  title: "Nuevo mensaje",
  body: "Hola",
  data: { chat_id: "chat-1" },
  email_override: "user@example.com",
  ...overrides,
});

const buildDispatcher = () => {
  const preferences_repository = {
    findByProfileId: vi
      .fn()
      .mockResolvedValue(AlertNotificationPreferences.createDefaults("user-1")),
    save: vi.fn(),
  };
  const profile_user_repository = {
    findEmailById: vi.fn().mockResolvedValue("user@example.com"),
  };
  const email_channel = { send: vi.fn().mockResolvedValue() };
  const in_app_channel = { send: vi.fn().mockResolvedValue("notif-1") };
  const push_channel = { send: vi.fn().mockResolvedValue() };
  const sms_channel = { send: vi.fn().mockResolvedValue() };
  const whatsapp_channel = { send: vi.fn().mockResolvedValue() };

  const dispatcher = new NotificationChannelDispatcher(
    preferences_repository as never,
    profile_user_repository as never,
    email_channel as never,
    in_app_channel as never,
    push_channel as never,
    sms_channel as never,
    whatsapp_channel as never,
  );

  return { dispatcher, email_channel, in_app_channel, push_channel };
};

describe("NotificationChannelDispatcher.notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("despacha email, in-app y push según las preferencias de la cuenta", async () => {
    const { dispatcher, email_channel, in_app_channel, push_channel } =
      buildDispatcher();

    await dispatcher.notify(input());

    expect(email_channel.send).toHaveBeenCalledTimes(1);
    expect(in_app_channel.send).toHaveBeenCalledTimes(1);
    expect(push_channel.send).toHaveBeenCalledTimes(1);
  });

  it("pasa al push el id de la notificación in-app", async () => {
    const { dispatcher, push_channel } = buildDispatcher();

    await dispatcher.notify(input());

    expect(push_channel.send).toHaveBeenCalledWith(expect.anything(), {
      notification_id: "notif-1",
    });
  });

  it("exclude_channels omite el push sin tocar email ni in-app", async () => {
    const { dispatcher, email_channel, in_app_channel, push_channel } =
      buildDispatcher();

    await dispatcher.notify(input({ exclude_channels: ["push"] }));

    expect(push_channel.send).not.toHaveBeenCalled();
    expect(email_channel.send).toHaveBeenCalledTimes(1);
    expect(in_app_channel.send).toHaveBeenCalledTimes(1);
  });

  it("exclude_channels también filtra channels_override", async () => {
    const { dispatcher, email_channel, push_channel } = buildDispatcher();

    await dispatcher.notify(
      input({ channels_override: ["push", "email"], exclude_channels: ["push"] }),
    );

    expect(push_channel.send).not.toHaveBeenCalled();
    expect(email_channel.send).toHaveBeenCalledTimes(1);
  });

  it("channels_override ['push'] envía solo push (chat con digest)", async () => {
    const { dispatcher, email_channel, in_app_channel, push_channel } =
      buildDispatcher();

    await dispatcher.notify(input({ channels_override: ["push"] }));

    expect(push_channel.send).toHaveBeenCalledTimes(1);
    expect(email_channel.send).not.toHaveBeenCalled();
    expect(in_app_channel.send).not.toHaveBeenCalled();
  });

  it("si el in-app falla, email y push se envían igual y el error se propaga al final", async () => {
    const { dispatcher, email_channel, in_app_channel, push_channel } =
      buildDispatcher();
    in_app_channel.send.mockRejectedValue(new Error("db"));

    await expect(dispatcher.notify(input())).rejects.toThrow("db");

    expect(email_channel.send).toHaveBeenCalledTimes(1);
    expect(push_channel.send).toHaveBeenCalledTimes(1);
    expect(push_channel.send).toHaveBeenCalledWith(expect.anything(), {
      notification_id: null,
    });
  });

  it("si el canal push rechaza, no impide que email e in-app se envíen", async () => {
    const { dispatcher, email_channel, in_app_channel, push_channel } =
      buildDispatcher();
    push_channel.send.mockRejectedValue(new Error("fcm"));

    await expect(dispatcher.notify(input())).rejects.toThrow("fcm");

    expect(email_channel.send).toHaveBeenCalledTimes(1);
    expect(in_app_channel.send).toHaveBeenCalledTimes(1);
  });
});
