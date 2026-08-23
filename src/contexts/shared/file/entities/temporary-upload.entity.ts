import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type TemporaryUploadStatus =
  | "pending_upload"
  | "uploaded"
  | "consumed"
  | "expired";

@Entity({ name: "temporary_uploads" })
export class TemporaryUploadEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @Column()
  storage_path: string;

  @Column()
  mime_type: string;

  @Column({ type: "integer" })
  size_bytes: number;

  @Column({
    type: "enum",
    enum: ["pending_upload", "uploaded", "consumed", "expired"],
    default: "pending_upload",
  })
  status: TemporaryUploadStatus;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
