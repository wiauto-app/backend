import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const VIDEO_UPLOAD_SESSION_STATUS = {
  INITIATED: "initiated",
  UPLOADED: "uploaded",
  CONSUMED: "consumed",
  ABORTED: "aborted",
  EXPIRED: "expired",
} as const;

export type VideoUploadSessionStatus =
  (typeof VIDEO_UPLOAD_SESSION_STATUS)[keyof typeof VIDEO_UPLOAD_SESSION_STATUS];

/**
 * Sesión de subida multipart directa a R2 de un vídeo de vehículo.
 * El cliente nunca envía la key: solo el `id` de la sesión.
 */
@Entity({ name: "video_upload_sessions" })
@Index("idx_video_upload_sessions_status_expires", ["status", "expires_at"])
export class VideoUploadSessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_video_upload_sessions_profile_id")
  @Column({ type: "uuid" })
  profile_id: string;

  /** Key completa en el bucket (`vehicles-videos/temp/{profileId}/{id}/original{ext}`). */
  @Column({ type: "text" })
  storage_key: string;

  /** `UploadId` de S3 multipart. */
  @Column({ type: "text" })
  multipart_upload_id: string;

  @Column({ type: "varchar", length: 100 })
  mime_type: string;

  @Column({ type: "text", nullable: true })
  original_filename: string | null;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  size_bytes: number;

  @Column({ type: "integer" })
  part_size: number;

  @Column({ type: "integer" })
  part_count: number;

  @Column({ type: "real", nullable: true })
  duration_s: number | null;

  @Column({ type: "integer", nullable: true })
  width: number | null;

  @Column({ type: "integer", nullable: true })
  height: number | null;

  @Column({
    type: "enum",
    enum: Object.values(VIDEO_UPLOAD_SESSION_STATUS),
    enumName: "video_upload_session_status_enum",
    default: VIDEO_UPLOAD_SESSION_STATUS.INITIATED,
  })
  status: VideoUploadSessionStatus;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
