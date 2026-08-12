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

@Entity("notification_devices")
@Index(["userId"])
@Index(["token"], { unique: true })
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
   * FCM registration token.
   */
  @Column({ type: "text" })
  token: string;

  @Column({
    type: "enum",
    enum: DevicePlatform,
  })
  platform: DevicePlatform;

  /**
   * Identificador del dispositivo generado por la aplicación.
   * Permite diferenciar instalaciones/dispositivos.
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  deviceId?: string;

  /**
   * Nombre/modelo del dispositivo.
   * Ej: iPhone 15 Pro, Pixel 9.
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  deviceName?: string;

  /**
   * Versión del sistema operativo.
   */
  @Column({ type: "varchar", length: 100, nullable: true })
  osVersion?: string;

  /**
   * Permite desactivar temporalmente el dispositivo.
   */
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastSeenAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}