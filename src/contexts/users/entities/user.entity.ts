import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Profile } from "../../profiles/entities/profile.entity";
import { SuspensionDurationType } from "./suspension_duration_type.entity";

export type AuthProvider = "local" | "google" | "apple";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true,select: false })
  password: string | null;

  @Column({ type: "varchar", default: "local" })
  provider: AuthProvider;

  @Column({ type: "varchar", nullable: true })
  provider_id: string | null;

  @Column("timestamp", { nullable: true })
  last_sign_in: Date;

  @Column({ type: "boolean", default: false })
  is_email_verified: boolean;

  @Column({ type: "boolean", default: false })
  two_factor_enabled: boolean;

  @Column({ type: "varchar", nullable: true, select: false })
  two_factor_secret: string | null; // cifrado AES-256-GCM, guardado en formato "iv:tag:ciphertext" en base64

  @Column({ type: "simple-array", nullable: true, select: false })
  two_factor_backup_codes: string[] | null; // bcrypt hashes, se consumen al usarse


  @Column({ type: "boolean", default: false })
  is_suspended: boolean;

  @Column({ type: "timestamp", nullable: true })
  suspended_at: Date | null;

  @Column({ type: "varchar", nullable: true })
  suspension_reason: string | null;

  @Column({ type: "timestamp", nullable: true })
  suspension_end_time: Date | null;

  @ManyToOne(() => SuspensionDurationType, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "suspension_duration_type_id" })
  suspension_duration_type: Relation<SuspensionDurationType | null>;

  @CreateDateColumn()
  created_at: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>;
}
