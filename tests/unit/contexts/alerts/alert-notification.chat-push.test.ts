import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertNotificationService } from "@/src/contexts/alerts/services/alert-notification.service";
import { AlertNotificationPreferences } from "@/src/contexts/alerts/types/alert-notification-preferences";
import type { ProcessAlertEventDto } from "@/src/contexts/alerts/dto/process-alert-event.dto";

const snapshot = {
  vehicle_id: "veh-1",
  profile_id: "seller-1",
  vehicle_label: "Seat Ibiza 2020",
  price: 12_000,
  cover_image_url: "https://media.wiauto.es/v.jpg",
  year: 2020,
  mileage: 50_000,
  fuel_type_slug: "gasolina",
  transmission_type: "manual",
  municipalities_slugs: [],
  province_slugs: [],
  make_slug: "seat",
  model_slug: "ibiza",
};

const chatEvent = (overrides: Partial<ProcessAlertEventDto> = {}): ProcessAlertEventDto => ({
  vehicle_id: "veh-1",
  event_type: "new_message",
  profile_id: "user-1",
  metadata: {
    chat_id: "chat-1",
    sender_name: "Ana",
    message_excerpt: "Hola",
  },
  ...overrides,
});

const buildService = (
  preferences: Parameters<AlertNotificationPreferences["update"]>[0] = {},
) => {
  const prefs = AlertNotificationPreferences.createDefaults("user-1").update(preferences);
  const published_vehicle_snapshot_port = {
    buildForVehicleId: vi.fn().mockResolvedValue(snapshot),
  };
  const preferences_repository = {
    findByProfileId: vi.fn().mockResolvedValue(prefs),
    save: vi.fn(),
  };
  const event_repository = {
    save: vi.fn().mockResolvedValue(),
    update: vi.fn().mockResolvedValue(),
    findDuplicate: vi.fn().mockResolvedValue(null),
  };
  const profile_user_repository = {
    findEmailById: vi.fn().mockResolvedValue("user@example.com"),
  };
  const notification_channel_dispatcher = {
    notify: vi.fn().mockResolvedValue(),
  };

  const service = new AlertNotificationService(
    published_vehicle_snapshot_port as never,
    {} as never,
    preferences_repository as never,
    event_repository as never,
    {} as never,
    {} as never,
    profile_user_repository as never,
    {} as never,
    notification_channel_dispatcher as never,
  );

  return { service, event_repository, notification_channel_dispatcher };
};

describe("AlertNotificationService: push de chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con frecuencia instant despacha por las preferencias y propaga exclude_channels", async () => {
    const { service, notification_channel_dispatcher } = buildService();

    await service.processEvent(chatEvent({ exclude_channels: ["push"] }));

    expect(notification_channel_dispatcher.notify).toHaveBeenCalledTimes(1);
    expect(notification_channel_dispatcher.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "user-1",
        category: "new_message",
        channels_override: undefined,
        exclude_channels: ["push"],
      }),
    );
  });

  it("con frecuencia daily el chat NO espera al digest: el push sale al instante", async () => {
    const { service, notification_channel_dispatcher, event_repository } =
      buildService({ frequency: "daily" });

    await service.processEvent(chatEvent());

    expect(notification_channel_dispatcher.notify).toHaveBeenCalledTimes(1);
    expect(notification_channel_dispatcher.notify).toHaveBeenCalledWith(
      expect.objectContaining({ channels_override: ["push"] }),
    );
    // El evento queda pendiente para el digest de email: el email no cambia.
    expect(event_repository.save).toHaveBeenCalledTimes(1);
    expect(event_repository.update).not.toHaveBeenCalled();
  });

  it("con frecuencia weekly también despacha el push al instante", async () => {
    const { service, notification_channel_dispatcher } = buildService({
      frequency: "weekly",
    });

    await service.processEvent(chatEvent({ event_type: "seller_reply" }));

    expect(notification_channel_dispatcher.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "seller_reply",
        channels_override: ["push"],
      }),
    );
  });

  it("con digest y exclude_channels push, el push instantáneo respeta la exclusión", async () => {
    const { service, notification_channel_dispatcher } = buildService({
      frequency: "daily",
    });

    await service.processEvent(chatEvent({ exclude_channels: ["push"] }));

    expect(notification_channel_dispatcher.notify).toHaveBeenCalledWith(
      expect.objectContaining({ exclude_channels: ["push"] }),
    );
  });

  it("con digest y channel_push desactivado no se envía nada al instante", async () => {
    const { service, notification_channel_dispatcher } = buildService({
      frequency: "daily",
      channel_push: false,
    });

    await service.processEvent(chatEvent());

    expect(notification_channel_dispatcher.notify).not.toHaveBeenCalled();
  });

  it("con digest y el toggle de mensajes apagado no se envía nada", async () => {
    const { service, notification_channel_dispatcher } = buildService({
      frequency: "daily",
      notify_new_messages: false,
    });

    await service.processEvent(chatEvent());

    expect(notification_channel_dispatcher.notify).not.toHaveBeenCalled();
  });
});
