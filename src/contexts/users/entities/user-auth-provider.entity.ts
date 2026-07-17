import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { User } from "./user.entity";

export type OAuthProvider = "google" | "apple";

@Entity("user_auth_providers")
@Index(["provider", "provider_id"], { unique: true })
@Index(["user_id", "provider"], { unique: true })
export class UserAuthProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @ManyToOne(() => User, (user) => user.auth_providers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @Column({ type: "varchar" })
  provider: OAuthProvider;

  @Column({ type: "varchar" })
  provider_id: string;

  @CreateDateColumn()
  created_at: Date;
}
