import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

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

  @CreateDateColumn()
  created_at: string;
}
