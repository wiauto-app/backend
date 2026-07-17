import type { UIMessage } from "ai";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

@Entity({ name: "assistant_conversations" })
@Index("IDX_assistant_conversations_user_id", ["user_id"])
export class AssistantConversationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "user_id",
    foreignKeyConstraintName: "FK_assistant_conversations_user_id",
  })
  user: Relation<User>;

  @Column({ type: "varchar", length: 60 })
  title: string;

  @Column({ type: "jsonb", default: [] })
  messages: UIMessage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
