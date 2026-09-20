import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DevicePlatform,
  PushTokenType,
} from "@/src/contexts/profile_devices/entities/profile_devices.entity";
import { ProfileDevicesService } from "@/src/contexts/profile_devices/services/profile-devices.service";

const EXPO_TOKEN = "ExponentPushToken[abc123]";
const FCM_TOKEN = "dGVzdC1mY20tdG9rZW46QVBBOTFiRw";
const RAW_APNS_TOKEN = "a".repeat(64);

const buildService = () => {
  const insert_builder = {
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orUpdate: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(),
  };
  const delete_builder = {
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ affected: 3 }),
  };
  const repository = {
    createQueryBuilder: vi
      .fn()
      .mockReturnValueOnce(insert_builder)
      .mockReturnValue(delete_builder),
    update: vi.fn().mockResolvedValue(),
    findOneByOrFail: vi.fn().mockResolvedValue({ id: "device-1" }),
    find: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(),
  };

  const service = new ProfileDevicesService(repository as never);
  return { service, repository, insert_builder, delete_builder };
};

describe("ProfileDevicesService.createProfileDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hace upsert por token y reasigna el dispositivo al usuario autenticado", async () => {
    const { service, insert_builder, repository } = buildService();

    const result = await service.createProfileDevice(
      {
        token: FCM_TOKEN,
        platform: DevicePlatform.ANDROID,
        deviceId: "install-1",
        appVersion: "1.2.3",
      },
      "user-b",
    );

    const values = insert_builder.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values).toMatchObject({
      userId: "user-b",
      token: FCM_TOKEN,
      tokenType: PushTokenType.FCM,
      isActive: true,
      appVersion: "1.2.3",
    });
    const [overwrite_columns, conflict_paths] = insert_builder.orUpdate.mock
      .calls[0] as [string[], string[]];
    expect(conflict_paths).toEqual(["token"]);
    expect(overwrite_columns).toEqual(
      expect.arrayContaining(["userId", "isActive", "lastSeenAt", "tokenType"]),
    );
    expect(repository.findOneByOrFail).toHaveBeenCalledWith({ token: FCM_TOKEN });
    expect(result).toEqual({ id: "device-1" });
  });

  it("es idempotente: registrar dos veces el mismo token no falla", async () => {
    const { service, repository } = buildService();
    repository.createQueryBuilder.mockReset();
    repository.createQueryBuilder.mockImplementation(() => ({
      insert: vi.fn().mockReturnThis(),
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      orUpdate: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(),
    }));
    const dto = { token: FCM_TOKEN, platform: DevicePlatform.ANDROID };

    await expect(service.createProfileDevice(dto, "user-a")).resolves.toBeDefined();
    await expect(service.createProfileDevice(dto, "user-a")).resolves.toBeDefined();
  });

  it("desactiva las filas con el mismo deviceId y otro token", async () => {
    const { service, repository } = buildService();

    await service.createProfileDevice(
      { token: FCM_TOKEN, platform: DevicePlatform.ANDROID, deviceId: "install-1" },
      "user-b",
    );

    expect(repository.update).toHaveBeenCalledTimes(1);
    const [criteria, patch] = repository.update.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(criteria.deviceId).toBe("install-1");
    expect(criteria.isActive).toBe(true);
    expect(patch).toEqual({ isActive: false });
  });

  it("no desactiva nada si el cliente no envía deviceId", async () => {
    const { service, repository } = buildService();

    await service.createProfileDevice(
      { token: FCM_TOKEN, platform: DevicePlatform.ANDROID },
      "user-a",
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rechaza iOS sin tokenType", async () => {
    const { service } = buildService();

    await expect(
      service.createProfileDevice(
        { token: EXPO_TOKEN, platform: DevicePlatform.IOS },
        "user-a",
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rechaza un token APNs crudo (hex) aunque declare tokenType", async () => {
    const { service } = buildService();

    await expect(
      service.createProfileDevice(
        {
          token: RAW_APNS_TOKEN,
          platform: DevicePlatform.IOS,
          tokenType: PushTokenType.FCM,
        },
        "user-a",
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rechaza tokenType expo con un formato de token inválido", async () => {
    const { service } = buildService();

    await expect(
      service.createProfileDevice(
        {
          token: FCM_TOKEN,
          platform: DevicePlatform.IOS,
          tokenType: PushTokenType.EXPO,
        },
        "user-a",
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("acepta un Expo Push Token válido en iOS", async () => {
    const { service, insert_builder } = buildService();

    await service.createProfileDevice(
      {
        token: EXPO_TOKEN,
        platform: DevicePlatform.IOS,
        tokenType: PushTokenType.EXPO,
      },
      "user-a",
    );

    const values = insert_builder.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values.tokenType).toBe(PushTokenType.EXPO);
  });
});

describe("ProfileDevicesService.unregister", () => {
  it("solo borra filas del usuario autenticado", async () => {
    const { service, repository } = buildService();

    await service.unregister(FCM_TOKEN, "user-a");

    expect(repository.delete).toHaveBeenCalledWith({
      token: FCM_TOKEN,
      userId: "user-a",
    });
  });
});

describe("ProfileDevicesService queries", () => {
  it("findActiveByUserId filtra por isActive y limita a 10", async () => {
    const { service, repository } = buildService();

    await service.findActiveByUserId("user-a");

    const options = repository.find.mock.calls[0][0] as Record<string, unknown>;
    expect(options.where).toEqual({ userId: "user-a", isActive: true });
    expect(options.take).toBe(10);
  });

  it("markDelivered sin ids no toca la base", async () => {
    const { service, repository } = buildService();

    await service.markDelivered([]);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("deleteStale devuelve cuántos dispositivos borró", async () => {
    const { service, repository } = buildService();
    repository.createQueryBuilder.mockReset();
    repository.createQueryBuilder.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 3 }),
    });

    await expect(service.deleteStale(new Date())).resolves.toBe(3);
  });
});
