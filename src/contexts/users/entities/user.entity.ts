import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type AuthProvider = "local" | "google" | "apple";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({unique:true})
  email: string;

  @Column({ type: "varchar", nullable: true })
  password: string | null;

  @Column({ type: "varchar", default: "local" })
  provider: AuthProvider;

  @Column({ type: "varchar", nullable: true })
  provider_id: string | null;

  @Column("timestamp", { nullable: true })
  last_sign_in: Date;

  @CreateDateColumn()
  created_at: string;
}
