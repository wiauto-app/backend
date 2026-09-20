import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";


export enum DevicePlatform {
  IOS = "ios",
  ANDROID = "android",
}

export enum PushTokenType {
  FCM = "fcm",
  EXPO = "expo",
}

@Entity("notification_devices")
@Index(["userId"])
@Index(["token"], { unique: true })
@Index("IDX_notification_devices_deviceId", ["deviceId"])
export class ProfileDevices {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  /**
   * FCM registration token o Expo Push Token, según `tokenType`.
   */
  @Column({ type: "text" })
  token: string;

  @Column({
    type: "enum",
    enum: DevicePlatform,
  })
  platform: DevicePlatform;

  /**
   * Proveedor que entrega el push: `fcm` (firebase-admin) o `expo` (Expo Push Service).
   */
  @Column({
    type: "enum",
    enum: PushTokenType,
    enumName: "notification_devices_token_type_enum",
    default: PushTokenType.FCM,
  })
  tokenType: PushTokenType;

  /**
   * Identificador del dispositivo generado por la aplicación.
   * Permite diferenciar instalaciones/dispositivos.
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  deviceId?: string | null;

  /**
   * Nombre/modelo del dispositivo.
   * Ej: iPhone 15 Pro, Pixel 9.
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  deviceName?: string | null;

  /**
   * Versión del sistema operativo.
   */
  @Column({ type: "varchar", length: 100, nullable: true })
  osVersion?: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  appVersion?: string | null;

  /**
   * Permite desactivar temporalmente el dispositivo.
   */
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastSeenAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}