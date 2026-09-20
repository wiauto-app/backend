import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";

import { CreateProfileDeviceDto } from "../dto/create-profile-device.dto";
import {
  DevicePlatform,
  ProfileDevices,
  PushTokenType,
} from "../entities/profile_devices.entity";
import { isExpoPushTokenFormat, isRawApnsToken } from "../types/push-token";

/** Máximo de dispositivos activos a los que se envía un push por usuario. */
const MAX_ACTIVE_DEVICES_PER_USER = 10;

@Injectable()
export class ProfileDevicesService {
  constructor(
    @InjectRepository(ProfileDevices)
    private readonly profileDevicesRepository: Repository<ProfileDevices>,
  ) {}

  /**
   * Registro idempotente: si el token ya existe se reasigna al usuario autenticado
   * (mismo teléfono, otra cuenta) y se reactiva.
   */
  async createProfileDevice(
    createProfileDeviceDto: CreateProfileDeviceDto,
    userId: string,
  ): Promise<ProfileDevices> {
    const tokenType = this.resolveTokenType(createProfileDeviceDto);
    const now = new Date();

    await this.profileDevicesRepository
      .createQueryBuilder()
      .insert()
      .into(ProfileDevices)
      .values({
        userId,
        token: createProfileDeviceDto.token,
        platform: createProfileDeviceDto.platform,
        tokenType,
        deviceId: createProfileDeviceDto.deviceId ?? null,
        deviceName: createProfileDeviceDto.deviceName ?? null,
        osVersion: createProfileDeviceDto.osVersion ?? null,
        appVersion: createProfileDeviceDto.appVersion ?? null,
        isActive: true,
        lastSeenAt: now,
        updatedAt: now,
      })
      .orUpdate(
        [
          "userId",
          "platform",
          "tokenType",
          "deviceId",
          "deviceName",
          "osVersion",
          "appVersion",
          "isActive",
          "lastSeenAt",
          "updatedAt",
        ],
        ["token"],
      )
      .execute();

    if (createProfileDeviceDto.deviceId) {
      // Un teléfono tiene un solo token vigente: cualquier otra fila con el mismo
      // deviceId (otro usuario, o token rotado) deja de recibir pushes.
      await this.profileDevicesRepository.update(
        {
          deviceId: createProfileDeviceDto.deviceId,
          token: Not(createProfileDeviceDto.token),
          isActive: true,
        },
        { isActive: false },
      );
    }

    return this.profileDevicesRepository.findOneByOrFail({
      token: createProfileDeviceDto.token,
    });
  }

  /**
   * Baja idempotente: solo borra filas del usuario autenticado.
   * Si el token es de otro usuario o no existe, no hace nada.
   */
  async unregister(token: string, userId: string): Promise<void> {
    await this.profileDevicesRepository.delete({ token, userId });
  }

  async findActiveByUserId(userId: string): Promise<ProfileDevices[]> {
    return this.profileDevicesRepository.find({
      where: { userId, isActive: true },
      order: { lastSeenAt: { direction: "DESC", nulls: "LAST" } },
      take: MAX_ACTIVE_DEVICES_PER_USER,
    });
  }

  /** Marca dispositivos como vivos tras un envío aceptado por el proveedor. */
  async markDelivered(deviceIds: string[]): Promise<void> {
    if (deviceIds.length === 0) {
      return;
    }
    await this.profileDevicesRepository.update(
      { id: In(deviceIds) },
      { lastSeenAt: new Date() },
    );
  }

  /** Borra un token que el proveedor reportó como inválido o desregistrado. */
  async deleteByToken(token: string): Promise<void> {
    await this.profileDevicesRepository.delete({ token });
  }

  /** Borra dispositivos sin señal de vida desde `before`. Devuelve cuántos borró. */
  async deleteStale(before: Date): Promise<number> {
    const result = await this.profileDevicesRepository
      .createQueryBuilder()
      .delete()
      .from(ProfileDevices)
      .where(`COALESCE("lastSeenAt", "updatedAt") < :before`, { before })
      .execute();
    return result.affected ?? 0;
  }

  private resolveTokenType(dto: CreateProfileDeviceDto): PushTokenType {
    if (isRawApnsToken(dto.token)) {
      throw new BadRequestException(
        "El token APNs crudo no es válido: usa un token FCM o un Expo Push Token",
      );
    }

    if (!dto.tokenType && dto.platform === DevicePlatform.IOS) {
      throw new BadRequestException("tokenType es obligatorio en iOS");
    }

    const tokenType = dto.tokenType ?? PushTokenType.FCM;

    if (tokenType === PushTokenType.EXPO && !isExpoPushTokenFormat(dto.token)) {
      throw new BadRequestException("El Expo Push Token no tiene un formato válido");
    }

    return tokenType;
  }
}
