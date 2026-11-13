import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { VehicleEntity } from "./vehicle.entity";

export const VEHICLE_VIDEO_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const;

export type VehicleVideoStatus =
  (typeof VEHICLE_VIDEO_STATUS)[keyof typeof VEHICLE_VIDEO_STATUS];

@Entity({ name: "vehicle_videos" })
export class VideosEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** URL pública del MP4 optimizado (null hasta que el worker termina). */
  @Column({ type: "varchar", nullable: true })
  url: string | null;

  @Column({ type: "varchar", nullable: true })
  thumbnail_url: string | null;

  @Column({
    type: "enum",
    enum: Object.values(VEHICLE_VIDEO_STATUS),
    enumName: "vehicle_video_status_enum",
    default: VEHICLE_VIDEO_STATUS.UPLOADED,
  })
  status: VehicleVideoStatus;

  @Column({ type: "integer", default: 0 })
  order: number;

  /** Key del original en R2 (se conserva para reprocesar, p. ej. HLS). */
  @Column({ type: "text", nullable: true })
  source_key: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  mime_type: string | null;

  @Column({
    type: "bigint",
    nullable: true,
    transformer: {
      to: (value: number | null | undefined) => value ?? null,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  original_size: number | null;

  @Column({ type: "real", nullable: true })
  duration_s: number | null;

  @Column({ type: "integer", nullable: true })
  width: number | null;

  @Column({ type: "integer", nullable: true })
  height: number | null;

  @Column({ type: "text", nullable: true })
  failure_reason: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  vehicle_id: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.videos, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}
