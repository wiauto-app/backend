import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from "typeorm";

import { ChatEntity } from "./chat.entity";
import { ChatMessageEntity } from "./chat-message.orm.entity";

@Entity({ name: "chat_participant_state" })
export class ChatParticipantStateEntity {
  @PrimaryColumn({ type: "uuid" })
  chat_id: string;

  @PrimaryColumn({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid", nullable: true })
  last_read_message_id: string | null;

  @ManyToOne(() => ChatMessageEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "last_read_message_id" })
  last_read_message: Relation<ChatMessageEntity> | null;

  @Column({ type: "timestamptz", nullable: true })
  last_read_at: Date | null;

  @Column({ type: "int", default: 0 })
  unread_count: number;

  @ManyToOne(() => ChatEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat: Relation<ChatEntity>;
}
